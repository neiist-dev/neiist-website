import React from "react";
import { Heading, Text, Table } from "@neiist/ui";
import ColorfulText from "@/components/ColorfulText";
import { PrivacySection } from "@/types/privacy";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, locales, LocaleParams } from "@/i18n/i18n-config";
import styles from "@/styles/pages/PrivacyPolicy.module.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: LocaleParams;
}

function renderTextWithLinks(text: string): React.ReactNode {
  const parts = text.split(/(https?:\/\/[^\s)]+|neiist@tecnico\.ulisboa\.pt)/g);
  let keyCount = 0;
  return parts.map((part) => {
    keyCount += 1;
    const key = `part-${keyCount}`;
    if (part === "neiist@tecnico.ulisboa.pt") {
      return (
        <a key={key} href={`mailto:${part}`} className={styles.link}>
          <strong>{part}</strong>
        </a>
      );
    }
    if (part.startsWith("http")) {
      return (
        <a key={key} href={part} target="_blank" rel="noopener noreferrer" className={styles.link}>
          <strong>{part}</strong>
        </a>
      );
    }
    return part;
  });
}

function renderSectionContent(section: PrivacySection) {
  switch (section.type) {
    case "controller":
      return (
        <>
          <Text>{section.intro}</Text>
          <Text>
            <strong>{section.organization}</strong>
            <br />
            {section.address}
            <br />
            {section.email_label}:{" "}
            <a href={`mailto:${section.email}`} className={styles.link}>
              <strong>{section.email}</strong>
            </a>
          </Text>
          <Text>{section.dpo_note}</Text>
          <Text>
            {section.complaint_text}{" "}
            <a
              href={section.authority_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}>
              <strong>{section.authority_name}</strong>
            </a>
          </Text>
        </>
      );

    case "table":
      return (
        <Table responsive="scroll">
          <Table.Head>
            <Table.Row>
              {section.headers.map((header) => (
                <Table.HeaderCell key={header}>{header}</Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {section.rows.map((row) => (
              <Table.Row key={row.data}>
                <Table.Cell>
                  <strong>{row.data}</strong>
                </Table.Cell>
                <Table.Cell>{renderTextWithLinks(row.purpose)}</Table.Cell>
                <Table.Cell>{renderTextWithLinks(row.legal_basis)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      );

    case "list":
      return (
        <>
          {section.intro && <Text>{renderTextWithLinks(section.intro)}</Text>}
          <ul className={styles.list}>
            {section.items.map((item) => (
              <li key={item.label || item.text.slice(0, 32)}>
                <Text>
                  {item.label && <strong>{item.label}: </strong>}
                  {renderTextWithLinks(item.text)}
                </Text>
              </li>
            ))}
          </ul>
          {section.subsections?.map((sub) => (
            <div key={sub.title} className={styles.subsection}>
              <Heading level={3} color="var(--primary-colour)">
                {sub.title}
              </Heading>
              {sub.paragraphs.map((p) => (
                <Text key={p.slice(0, 32)}>{renderTextWithLinks(p)}</Text>
              ))}
              {sub.items.length > 0 && (
                <ul className={styles.list}>
                  {sub.items.map((subItem) => (
                    <li key={subItem.slice(0, 32)}>
                      <Text>{renderTextWithLinks(subItem)}</Text>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {section.outro && <Text>{renderTextWithLinks(section.outro)}</Text>}
        </>
      );

    case "paragraphs":
      return section.paragraphs.map((p) => (
        <Text key={p.slice(0, 32)}>{renderTextWithLinks(p)}</Text>
      ));
  }
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const content = getDictionary(locale).privacy_policy_page;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ColorfulText text={content.title} />
        <Text variant="muted">
          {content.last_updated_label}: {content.last_updated_date}
        </Text>
        <Text>{content.intro}</Text>
      </header>

      {(content.sections as PrivacySection[]).map((section) => (
        <section key={section.id} className={styles.section}>
          <Heading level={2} color="var(--primary-colour)">
            {section.title}
          </Heading>
          {renderSectionContent(section)}
        </section>
      ))}
    </div>
  );
}
