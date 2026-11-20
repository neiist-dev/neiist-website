import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Badge, Button, Card, Carousel, Stack, Text } from "@neiist/ui";
import { FiArrowRight, FiCalendar, FiExternalLink } from "react-icons/fi";

const ACTIVITIES = [
  {
    id: "sweats",
    title: "Sweats EIC",
    description:
      "E o que achas de teres uma sweat com o nome do teu curso? O NEIIST dá-te a oportunidade de teres a sweat do melhor curso!",
  },
  {
    id: "layout",
    title: "Concurso de Layout de Sweats",
    description:
      "Liberta a tua criatividade e desenha o próximo layout oficial das sweats de Engenharia Informática e de Computadores.",
  },
  {
    id: "churrasco",
    title: "Churrasco EIC",
    description:
      "Traz os teus amigos para uma tarde de convívio, matraquilhos e comida no campus para começar o semestre.",
  },
  {
    id: "esports",
    title: "E-Sports Tournament",
    description:
      "Compete com a tua equipa nos torneios universitários de gaming organizados pelo núcleo.",
  },
  {
    id: "aoc",
    title: "Advent of Code",
    description:
      "Desafios diários de programação em dezembro com leaderboard exclusiva para Informática do Técnico.",
  },
];

const FEATURE_HIGHLIGHTS = [
  {
    id: "neiist-hackthon",
    badge: <Badge variant="primary">Annual Event</Badge>,
    subtitle: "Hackthon",
    title: "Solidarity Hackthon",
    description: (
      <>
        <Text variant="muted">
          Annual technology hackaton geared twoards the development of sulutions to support local
          ONG.
        </Text>
        <Text variant="muted">
          Explore the full schedule on the <a href="#sinfo-schedule">conference schedule</a> or
          review <a href="#sinfo-partners">partner opportunities</a> for next edition.
        </Text>
      </>
    ),
    actions: (
      <Button size="sm" variant="solid">
        Explore Event <FiArrowRight />
      </Button>
    ),
  },
  {
    id: "workshops",
    badge: <Badge variant="secondary">Hands-on</Badge>,
    subtitle: "Weekly Series",
    title: "Technical Workshops & Bootcamps",
    description: (
      <>
        <Text variant="muted">
          From Python and C fundamentals to distributed systems and Rust, our workshops help
          students bridge classroom concepts and real-world engineering tooling.
        </Text>
        <ul>
          <li>Beginner-friendly sessions every semester</li>
          <li>
            Open-source materials published on <a href="#workshops-github">GitHub</a>
          </li>
        </ul>
      </>
    ),
    actions: (
      <Button size="sm" variant="outline">
        <FiCalendar /> View Upcoming Dates
      </Button>
    ),
  },
  {
    id: "merch",
    badge: <Badge variant="tertiary">NEIIST Store</Badge>,
    subtitle: "Course Identity",
    title: "Official EIC Sweats & Merch",
    description: (
      <>
        <Text variant="muted">
          Every academic year students submit and vote on new course sweater designs, hoodies, and
          limited-run accessories available in our online shop.
        </Text>
        <Text variant="muted">
          Check current stock in the <a href="#shop-catalog">shop catalog</a> or read sizing tips in
          our <a href="#size-guide">size guide</a>.
        </Text>
      </>
    ),
    actions: (
      <Button size="sm" variant="solid">
        Visit Shop <FiExternalLink />
      </Button>
    ),
  },
];

const QUICK_MODULES = [
  { id: "m1", title: "2 Cards / Row", meta: "Compact grid item", tag: "Layout" },
  { id: "m2", title: "3 Cards / Row", meta: "Default desktop view", tag: "Carousel" },
  { id: "m3", title: "4 Cards / Row", meta: "High density shelf", tag: "Catalog" },
  { id: "m4", title: "Keyboard Support", meta: "Left & Right arrows", tag: "A11y" },
  { id: "m5", title: "Drag Physics", meta: "Inertia & snap", tag: "Touch" },
  { id: "m6", title: "Controlled State", meta: "activeIndex support", tag: "React 19" },
];

export const CarouselDemo = () => {
  const [controlledSlide, setControlledSlide] = useState(0);

  return (
    <>
      <PageHeader
        title="Carousel"
        description="Responsive carousel wrapper with drag physics, infinite loop, hover overlay cards, and single-slide feature highlights."
      />

      <DemoCard
        title="Overlay Card Carousel (3 per row + Autoplay)"
        description="Drag to slide, or hover/focus any card to reveal its title and description overlay.">
        <Carousel slidesPerView={3} autoplay={3500}>
          {ACTIVITIES.map((activity) => (
            <Carousel.OverlayCard
              key={activity.id}
              title={activity.title}
              description={activity.description}
            />
          ))}
        </Carousel>
      </DemoCard>

      <DemoCard
        title="Feature Card Carousel (1 per row, Image Left + Rich Description)"
        description="Clean split layout directly on the page background with outside arrows, pagination dots, and rich text.">
        <Stack gap="sm">
          <Carousel
            slidesPerView={1}
            arrowPlacement="outside"
            showDots={true}
            activeIndex={controlledSlide}
            onSlideChange={setControlledSlide}>
            {FEATURE_HIGHLIGHTS.map((item) => (
              <Carousel.FeatureCard
                key={item.id}
                badge={item.badge}
                subtitle={item.subtitle}
                title={item.title}
                description={item.description}
                actions={item.actions}
              />
            ))}
          </Carousel>
          <Text size="sm" variant="muted">
            Active feature slide: {controlledSlide + 1} / {FEATURE_HIGHLIGHTS.length}
          </Text>
        </Stack>
      </DemoCard>

      <DemoCard
        title="Generic Component Carousel (4 per row)"
        description="Wrap any @neiist/ui components (such as Card) inside Carousel or Carousel.Item.">
        <Carousel slidesPerView={4} showDots={true}>
          {QUICK_MODULES.map((mod) => (
            <Carousel.Item key={mod.id}>
              <Card variant="elevated">
                <Card.Header title={mod.title} action={<Badge size="sm">{mod.tag}</Badge>} />
                <Card.Body>
                  <Text size="sm" variant="muted">
                    {mod.meta}
                  </Text>
                </Card.Body>
              </Card>
            </Carousel.Item>
          ))}
        </Carousel>
      </DemoCard>
    </>
  );
};
