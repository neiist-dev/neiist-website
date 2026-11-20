import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { BentoGrid, Button, Stack, Text } from "@neiist/ui";
import { FiArrowRight, FiExternalLink, FiLink } from "react-icons/fi";

const BENTO_ITEMS = [
  {
    id: "item-1",
    title: "Hackaton",
    description: (
      <>
        <Text size="sm" variant="muted">
          Annual technology hackaton geared twoards the development of sulutions to support local
          ONG.
        </Text>
        <Text size="sm" variant="muted">
          See the <a href="#sinfo-schedule">event schedule</a> or review{" "}
          <a href="#sinfo-speakers">speaker details</a>.
        </Text>
      </>
    ),
    actions: (
      <>
        <Button size="sm" variant="solid">
          Learn More <FiArrowRight />
        </Button>
        <Button size="sm" variant="outline">
          Website <FiExternalLink />
        </Button>
      </>
    ),
  },
  {
    id: "item-2",
    title: "Technical Workshops",
    description: (
      <Text size="sm" variant="muted">
        Hands-on sessions covering Python, C, Rust, and systems engineering across{" "}
        <a href="#workshops-alameda">Alameda</a> and <a href="#workshops-tagus">Taguspark</a>.
      </Text>
    ),
    actions: (
      <Button size="sm" variant="outline">
        View Calendar
      </Button>
    ),
  },
  {
    id: "item-3",
    title: "Merch & Sweats",
    description: (
      <Text size="sm" variant="muted">
        Official EIC sweaters, hoodies, and limited student-designed editions in the{" "}
        <a href="#shop-merch">online store</a>.
      </Text>
    ),
    actions: (
      <Button size="sm" variant="solid">
        Open Shop <FiArrowRight />
      </Button>
    ),
  },
  {
    id: "item-4",
    title: "Open Source Campus Tools",
    description: (
      <Text size="sm" variant="muted">
        Student-built platforms for <a href="#tools-voting">elections</a>,{" "}
        <a href="#tools-tickets">activity ticketing</a>, and <a href="#tools-pos">POS</a> workflows.
      </Text>
    ),
    actions: (
      <Button size="sm" variant="outline">
        Repository <FiExternalLink />
      </Button>
    ),
  },
  {
    id: "item-5",
    title: "Mentoring & Career Clinics",
    description: (
      <Text size="sm" variant="muted">
        Mock interviews, portfolio reviews, and internship preparation listed in our{" "}
        <a href="#career-resources">career guide</a>.
      </Text>
    ),
    actions: (
      <Button size="sm" variant="solid">
        Register
      </Button>
    ),
  },
  {
    id: "item-6",
    title: "Community Events",
    description: (
      <Text size="sm" variant="muted">
        Semester barbecues, e-sports tournaments, and study nights open to all{" "}
        <a href="#community-events">Informatics students</a>.
      </Text>
    ),
    actions: (
      <Button size="sm" variant="outline">
        See Activities
      </Button>
    ),
  },
];

export const BentoGridDemo = () => {
  const openDeepLink = (id: string) => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#${id}`) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    window.location.hash = id;
  };

  return (
    <>
      <PageHeader
        title="BentoGrid"
        description="Responsive 3-column bento grid with automatic alternating spans, rich content with links, button actions, and deep-link expand support."
      />

      <DemoCard
        title="Bento Grid (initialCount=4 + Deep-Links)"
        description="Rows alternate between [2 cols, 1 col] and [1 col, 2 cols]. Deep-link buttons expand hidden cards and scroll directly to the target item.">
        <Stack gap="md">
          <Stack direction="row" gap="sm" wrap>
            <Button size="sm" variant="outline" onClick={() => openDeepLink("item-2")}>
              <FiLink /> Open #item-2
            </Button>
            <Button size="sm" variant="outline" onClick={() => openDeepLink("item-5")}>
              <FiLink /> Open #item-5 (hidden)
            </Button>
            <Button size="sm" variant="outline" onClick={() => openDeepLink("item-6")}>
              <FiLink /> Open #item-6 (hidden)
            </Button>
          </Stack>

          <BentoGrid initialCount={4}>
            {BENTO_ITEMS.map((item) => (
              <BentoGrid.Item
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                actions={item.actions}
              />
            ))}
          </BentoGrid>
        </Stack>
      </DemoCard>

      <DemoCard
        title="Swap Mode (mode='swap')"
        description="Wide cards show their description and actions by default. Hovering or focusing a narrow card smoothly swaps the row widths horizontally.">
        <BentoGrid mode="swap">
          {BENTO_ITEMS.slice(0, 4).map((item) => (
            <BentoGrid.Item
              key={`swap-${item.id}`}
              title={item.title}
              description={item.description}
              actions={item.actions}
            />
          ))}
        </BentoGrid>
      </DemoCard>
    </>
  );
};
