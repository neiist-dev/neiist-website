"use client";

import React from "react";
import { Field, Select, Checkbox, Badge } from "@neiist/ui";
import { FaLayerGroup } from "react-icons/fa";
import { ProductType, ProductChannel, StockType } from "@/types/shop/product";
import { Activity } from "@/types/events";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";

interface TypeChannelsSectionProps {
  productType: ProductType;
  channels: ProductChannel[];
  eventId: string;
  eventHook: string;
  events?: Activity[];
  onUpdate: (_updates: {
    product_type?: ProductType;
    channels?: ProductChannel[];
    stock_type?: StockType;
    event_id?: string;
    event_hook?: "default_signup";
  }) => void;
}

export function TypeChannelsSection({
  productType,
  channels,
  eventId,
  eventHook: _eventHook,
  events,
  onUpdate,
}: TypeChannelsSectionProps) {
  const eventOptions = React.useMemo(() => {
    const list = [
      { label: "Nenhuma atividade associada", value: "" },
      ...(events?.map((ev) => {
        const dateStr = ev.start ? new Date(ev.start).toLocaleDateString("pt-PT") : "";
        const title = ev.title || "Sem título";
        return {
          label: dateStr ? `${title} (${dateStr})` : title,
          value: ev.id,
        };
      }) ?? []),
    ];

    if (eventId && !list.some((opt) => opt.value === eventId)) {
      list.push({ label: `Evento Atual (${eventId})`, value: eventId });
    }

    return list;
  }, [events, eventId]);

  return (
    <div className={styles.stackBlock}>
      <div className={styles.sectionTitle}>
        <FaLayerGroup /> Tipo & Canais de Venda
      </div>

      <Field label="Tipo de Produto">
        <Select
          options={[
            { label: "Artigo / Merchandising", value: "merchandise" },
            { label: "Bilhete de Evento", value: "event_ticket" },
            { label: "Comida & Bebida / Festival", value: "food_drink" },
          ]}
          value={productType}
          onChange={(val) => {
            const pt = val as ProductType;
            if (pt === "food_drink") {
              onUpdate({
                product_type: pt,
                channels: ["fast-pos"],
                stock_type: "untracked",
              });
            } else if (pt === "event_ticket") {
              onUpdate({
                product_type: pt,
                channels: channels.filter((c) => c !== "fast-pos"),
                event_hook: "default_signup",
              });
            } else {
              onUpdate({ product_type: pt });
            }
          }}
        />
      </Field>

      <Field label="Canais de Venda Disponíveis">
        <div className={styles.channelRow}>
          <Checkbox
            label="Loja Online (Web)"
            checked={channels.includes("web")}
            disabled={productType === "food_drink"}
            onChange={(e) => {
              const checked = e.target.checked;
              const next: ProductChannel[] = checked
                ? [...channels.filter((c) => c !== "web"), "web"]
                : channels.filter((c) => c !== "web");
              onUpdate({ channels: next.length > 0 ? next : ["web"] });
            }}
          />
          <Checkbox
            label="Balcão Presencial (POS)"
            checked={channels.includes("pos")}
            disabled={productType === "food_drink"}
            onChange={(e) => {
              const checked = e.target.checked;
              const next: ProductChannel[] = checked
                ? [...channels.filter((c) => c !== "pos"), "pos"]
                : channels.filter((c) => c !== "pos");
              onUpdate({ channels: next.length > 0 ? next : ["pos"] });
            }}
          />
          <Checkbox
            label="Balcão Rápido (Fast POS)"
            checked={channels.includes("fast-pos")}
            disabled={productType === "event_ticket" || productType === "food_drink"}
            onChange={(e) => {
              const checked = e.target.checked;
              const next: ProductChannel[] = checked
                ? [...channels.filter((c) => c !== "fast-pos"), "fast-pos"]
                : channels.filter((c) => c !== "fast-pos");
              onUpdate({
                channels: next.length > 0 ? next : ["pos"],
                ...(checked ? { stock_type: "untracked" } : {}),
              });
            }}
          />
        </div>
      </Field>

      {productType === "event_ticket" && (
        <div className={styles.col}>
          <Field label="Atividade / Evento Associado">
            <Select
              placeholder="Selecionar Atividade / Evento..."
              value={eventId || ""}
              onChange={(val) => {
                const nextId = (val as string) || "";
                onUpdate({
                  event_id: nextId,
                  event_hook: nextId ? "default_signup" : undefined,
                });
              }}
              options={eventOptions}
            />
          </Field>

          {eventId ? (
            <div className={styles.eventBox}>
              <Badge variant="primary">default_signup</Badge>
              <span className={styles.eventBoxText}>
                Inscrição automática na atividade confirmada ao efetuar a compra do bilhete.
              </span>
            </div>
          ) : (
            <p className={styles.eventHelpText}>
              Seleciona uma atividade para associar a emissão deste bilhete à inscrição de
              participantes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
