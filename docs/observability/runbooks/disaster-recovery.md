# Disaster Recovery: PostgreSQL Restore & GDPR Erasure Replay

Restoring a backup brings back the database as it was when the backup was taken. Any user who deleted their account after that moment would come back with their personal data ("zombie data"), which breaks GDPR Art. 17. This runbook restores a cluster and re-applies those erasures before live traffic resumes.

The restore itself lives in [neiist-infra](https://github.com/neiist-dev/neiist-infra) (`restore_db.yml`). Everything below runs from a checkout of that repo, unless it says "on the server".

## How erasures are recorded

Every account deletion (self-service or admin) appends one line to the tombstones ledger:

```text
{"istid":"ist100004","erased_at":"2026-10-02T15:00:00.000Z","initiated_by":"user_request","event":"user_erased"}
```

`initiated_by` is `user_request` when users delete their own account, or `admin:<istid>` when an admin deletes it.

| Where                                              | What                                                               | Survives                              |
| :------------------------------------------------- | :----------------------------------------------------------------- | :------------------------------------ |
| `/var/log/neiist/tombstones.jsonl` (on the server) | Written by the app on every deletion                               | A database restore on the same server |
| `gdrive:tombstones/tombstones.jsonl`               | Copy of the file above, synced by `pg_backup.sh` with every backup | Losing the server                     |

Lines older than `backup_retention_days` (14) are pruned from the file by `pg_backup.sh`, together with the backups. After that, no backup holds that user's data anymore.

After the restore, `/usr/local/bin/replay_gdpr_erasures.sh` merges both copies and deletes or anonymizes again every user erased **after the restored backup started**. It reads that time from `backup_label.old` in the restored data directory. Users who deleted their account and logged in again before the backup are kept.

## 1. Stop live traffic

On the server, stop the app that uses the cluster you are restoring:

```bash
# main cluster (production)
sudo -iu neiist pm2 stop blue green

# staging cluster
sudo -iu neiist pm2 stop staging
```

## 2. Keep a copy of the local ledger

If the server is still alive, copy the ledger before doing anything else. It has every erasure up to now, while the Drive copy only has erasures up to the last backup.

```bash
sudo cp -p /var/log/neiist/tombstones.jsonl /root/tombstones.jsonl.$(date +%Y%m%d_%H%M%S)
```

If the server is lost, skip this step. The restore uses the Drive copy, and erasures made after the last backup cannot be recovered.

## 3. Restore the cluster

```bash
# Interactive (asks for the cluster and confirmation)
./scripts/restore_db.sh

# Non-interactive
ansible-playbook -i inventory.ini restore_db.yml -e "target_cluster=main" -e "confirm_restore=yes"
```

The playbook downloads the latest backup, restores it, starts PostgreSQL and then runs `replay_gdpr_erasures.sh <cluster>`, which:

1. downloads `gdrive:tombstones/tombstones.jsonl` (a missing file is only a warning);
2. merges it with `/var/log/neiist/tombstones.jsonl`;
3. runs `neiist.delete_user()` for every user erased after the backup started who still has personal data.

The summary at the end shows the result:

```
[*] Replaying GDPR erasures made after 2026-10-16T02:30:01Z onto cluster 'main'...
[✓] Successfully re-erased 2 users resurrected from backup!
```

## 4. Verify

On the server, run the replay again. It must not find anyone left to erase:

```bash
sudo /usr/local/bin/replay_gdpr_erasures.sh main   # or: staging
```

```
[✓] Successfully re-erased 0 users resurrected from backup!
```

## 5. Resume live traffic

```bash
sudo -iu neiist pm2 start blue green   # or: staging
```

## Manual replay

Use this if the playbook step failed, or to replay the ledger copy from step 2. Run it on the server, and make sure live traffic is stopped first.

```bash
# Only if the live file is gone: put the copy from step 2 back first
sudo install -o neiist -g neiist -m 640 /root/tombstones.jsonl.<timestamp> /var/log/neiist/tombstones.jsonl

sudo /usr/local/bin/replay_gdpr_erasures.sh main   # or: staging
```

The script is idempotent: running it again erases nobody.

## Known limitations

- **The Drive copy is only as recent as the last backup** (daily at 03:30). If the server is lost, erasures made since then are not replayed.
- **Production and staging write to the same ledger file.** A deletion on staging is replayed on a production restore if the same `istid` exists there.
- **Only the latest base backup is restored**; WAL segments are not replayed.
