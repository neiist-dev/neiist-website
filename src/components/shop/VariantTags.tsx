import { Badge, ColorSwatch, Stack } from "@neiist/ui";
import { isColorKey, formatVariantSimple } from "@/utils/shop/shopUtils";

interface VariantTagsProps {
  options?: Record<string, string>;
  label?: string | null;
  showColorSwatch?: boolean;
  className?: string;
}

export default function VariantTags({
  options,
  label,
  showColorSwatch = false,
  className,
}: VariantTagsProps) {
  const { text: variantText, colorInfo } = formatVariantSimple(options, label);
  const nonColorEntries = options ? Object.entries(options).filter(([k]) => !isColorKey(k)) : [];

  if (!showColorSwatch) {
    if (nonColorEntries.length === 0) return null;
    return (
      <>
        {nonColorEntries.map(([k, v]) =>
          className ? (
            <span className={className} key={k}>
              {v}
            </span>
          ) : (
            <Badge key={k} variant="outline" size="sm">
              {v}
            </Badge>
          )
        )}
      </>
    );
  }

  const hasColor = Boolean(colorInfo.hex);
  const hasTags = nonColorEntries.length > 0 || Boolean(variantText);

  if (!hasColor && !hasTags) return null;

  return (
    <Stack direction="row" gap="sm" align="center" wrap>
      {colorInfo.hex && (
        <ColorSwatch
          color={colorInfo.hex}
          size="sm"
          style={{ inlineSize: "0.875rem", blockSize: "0.875rem" }}
          title={colorInfo.name || colorInfo.hex}
          ariaLabel={colorInfo.name || colorInfo.hex}
        />
      )}
      {nonColorEntries.length > 0 ? (
        nonColorEntries.map(([k, v]) => (
          <Badge key={k} variant="outline" size="sm" className={className}>
            {v}
          </Badge>
        ))
      ) : variantText ? (
        <Badge variant="outline" size="sm" className={className}>
          {variantText}
        </Badge>
      ) : null}
    </Stack>
  );
}
