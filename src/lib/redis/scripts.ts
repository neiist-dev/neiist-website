/**
 * Lua script to atomically clean expired holds, sum active holds,
 * verify availability against PostgreSQL base stock, and register the new hold.
 *
 * KEYS[1]: stock:hold:{productId}:{variantId}
 * ARGV[1]: now_ms (string/number)
 * ARGV[2]: expires_ms (string/number)
 * ARGV[3]: order_number
 * ARGV[4]: requested_qty (number)
 * ARGV[5]: pg_available_stock (number)
 *
 * Returns: 1 if hold acquired, 0 if insufficient stock.
 */
export const RESERVE_STOCK_HOLD_LUA = `
local hold_key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local expires_ms = tonumber(ARGV[2])
local order_number = ARGV[3]
local requested_qty = tonumber(ARGV[4])
local pg_stock = tonumber(ARGV[5])

-- 1. Remove expired holds lazily
redis.call('ZREMRANGEBYSCORE', hold_key, '-inf', now_ms)

-- 2. Sum active holds from OTHER orders (excluding existing hold by this order)
local order_prefix = order_number .. ":"
local members = redis.call('ZRANGE', hold_key, 0, -1)
local total_held = 0

for _, member in ipairs(members) do
  if string.sub(member, 1, string.len(order_prefix)) ~= order_prefix then
    local qty_str = string.match(member, ":([^:]+)$")
    if qty_str then
      local qty = tonumber(qty_str)
      if qty then
        total_held = total_held + qty
      end
    end
  end
end

-- If requested_qty <= 0, remove any existing hold for this order and succeed
if requested_qty <= 0 then
  for _, member in ipairs(members) do
    if string.sub(member, 1, string.len(order_prefix)) == order_prefix then
      redis.call('ZREM', hold_key, member)
    end
  end
  return 1
end

-- 3. Check stock capacity
if (total_held + requested_qty) > pg_stock then
  return 0
end

-- 4. Remove any existing member for this order_number before adding new hold
for _, member in ipairs(members) do
  if string.sub(member, 1, string.len(order_prefix)) == order_prefix then
    redis.call('ZREM', hold_key, member)
  end
end

-- 5. Record new hold and ensure key TTL covers the furthest expiration
local member_val = order_number .. ":" .. requested_qty
redis.call('ZADD', hold_key, expires_ms, member_val)
local pttl = redis.call('PTTL', hold_key)
if pttl < 0 or (expires_ms - now_ms) > pttl then
  redis.call('PEXPIREAT', hold_key, expires_ms)
end
return 1
`;

/**
 * Lua script to release a stock hold for a specific order.
 *
 * KEYS[1]: stock:hold:{productId}:{variantId}
 * ARGV[1]: order_number
 */
export const RELEASE_STOCK_HOLD_LUA = `
local hold_key = KEYS[1]
local order_prefix = ARGV[1] .. ":"

local members = redis.call('ZRANGE', hold_key, 0, -1)
local removed = 0

for _, member in ipairs(members) do
  if string.sub(member, 1, string.len(order_prefix)) == order_prefix then
    redis.call('ZREM', hold_key, member)
    removed = removed + 1
  end
end

return removed
`;

/**
 * Lua script to atomically release a lock only if held by the caller.
 *
 * KEYS[1]: lock_key
 * ARGV[1]: lock_owner_id
 */
export const RELEASE_LOCK_LUA = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

/**
 * Lua script to atomically pump due delayed jobs from ZSET into Stream.
 *
 * KEYS[1]: jobs:delayed
 * KEYS[2]: jobs:stream
 * ARGV[1]: now_ms
 * ARGV[2]: limit (max jobs to pump in one tick)
 */
export const PUMP_DELAYED_JOBS_LUA = `
local delayed_key = KEYS[1]
local stream_key = KEYS[2]
local now_ms = ARGV[1]
local limit = tonumber(ARGV[2]) or 50

local jobs = redis.call('ZRANGEBYSCORE', delayed_key, '-inf', now_ms, 'LIMIT', 0, limit)
local count = 0

for _, job in ipairs(jobs) do
  redis.call('XADD', stream_key, 'MAXLEN', '~', 10000, '*', 'payload', job)
  redis.call('ZREM', delayed_key, job)
  count = count + 1
end

return count
`;
