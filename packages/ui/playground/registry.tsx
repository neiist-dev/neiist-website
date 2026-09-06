import React from "react";
import AlertDemo from "./demos/AlertDemo";
import AvatarDemo from "./demos/AvatarDemo";
import BadgeDemo from "./demos/BadgeDemo";
import ButtonDemo from "./demos/ButtonDemo";
import { CalendarDemo } from "./demos/CalendarDemo";
import CardDemo from "./demos/CardDemo";
import CheckboxDemo from "./demos/CheckboxDemo";
import ColorSwatchDemo from "./demos/ColorSwatchDemo";
import ColourPickerDemo from "./demos/ColourPickerDemo";
import ContainerDemo from "./demos/ContainerDemo";
import { DateInputDemo } from "./demos/DateInputDemo";
import EmptyStateDemo from "./demos/EmptyStateDemo";
import FieldDemo from "./demos/FieldDemo";
import HeadingDemo from "./demos/HeadingDemo";
import InputDemo from "./demos/InputDemo";
import ModalDemo from "./demos/ModalDemo";
import MultiSelectDemo from "./demos/MultiSelectDemo";
import SelectDemo from "./demos/SelectDemo";
import { SpinnerDemo } from "./demos/SpinnerDemo";
import StackDemo from "./demos/StackDemo";
import TextDemo from "./demos/TextDemo";
import { TimelineDemo } from "./demos/TimelineDemo";
import ToggleSwitchDemo from "./demos/ToggleSwitchDemo";
import { ConfirmDialogDemo } from "./demos/ConfirmDialogDemo";
import { InputDialogDemo } from "./demos/InputDialogDemo";
import { DrawerDemo } from "./demos/DrawerDemo";
import { TooltipDemo } from "./demos/TooltipDemo";
import { SearchInputDemo } from "./demos/SearchInputDemo";
import { TableDemo } from "./demos/TableDemo";
import { TabsDemo } from "./demos/TabsDemo";
import { AccordionDemo } from "./demos/AccordionDemo";
import { DropdownMenuDemo } from "./demos/DropdownMenuDemo";
import { MemberCardDemo } from "./demos/MemberCardDemo";
import { TextareaDemo } from "./demos/TextareaDemo";
import { RadioDemo } from "./demos/RadioDemo";
import { SkeletonDemo } from "./demos/SkeletonDemo";
import { DividerDemo } from "./demos/DividerDemo";
import { PopoverDemo } from "./demos/PopoverDemo";

export type ComponentCategory = "Primitives" | "Components";

export interface ComponentEntry {
  id: string;
  label: string;
  category: ComponentCategory;
  component: React.ReactNode;
}

export const CATEGORIES: ComponentCategory[] = ["Primitives", "Components"];

export const COMPONENTS: ComponentEntry[] = [
  // Primitives
  { id: "avatar", label: "Avatar", category: "Primitives", component: <AvatarDemo /> },
  { id: "badge", label: "Badge", category: "Primitives", component: <BadgeDemo /> },
  { id: "button", label: "Button", category: "Primitives", component: <ButtonDemo /> },
  { id: "calendar", label: "Calendar", category: "Primitives", component: <CalendarDemo /> },
  { id: "checkbox", label: "Checkbox", category: "Primitives", component: <CheckboxDemo /> },
  {
    id: "colorswatch",
    label: "ColorSwatch",
    category: "Primitives",
    component: <ColorSwatchDemo />,
  },
  { id: "container", label: "Container", category: "Primitives", component: <ContainerDemo /> },
  { id: "divider", label: "Divider", category: "Primitives", component: <DividerDemo /> },
  { id: "drawer", label: "Drawer", category: "Primitives", component: <DrawerDemo /> },
  { id: "heading", label: "Heading", category: "Primitives", component: <HeadingDemo /> },
  { id: "input", label: "Input", category: "Primitives", component: <InputDemo /> },
  { id: "modal", label: "Modal", category: "Primitives", component: <ModalDemo /> },
  { id: "popover", label: "Popover", category: "Primitives", component: <PopoverDemo /> },
  { id: "radio", label: "Radio & RadioGroup", category: "Primitives", component: <RadioDemo /> },
  { id: "skeleton", label: "Skeleton", category: "Primitives", component: <SkeletonDemo /> },
  { id: "spinner", label: "Spinner", category: "Primitives", component: <SpinnerDemo /> },
  { id: "stack", label: "Stack", category: "Primitives", component: <StackDemo /> },
  { id: "text", label: "Text", category: "Primitives", component: <TextDemo /> },
  { id: "textarea", label: "Textarea", category: "Primitives", component: <TextareaDemo /> },
  {
    id: "toggleswitch",
    label: "ToggleSwitch",
    category: "Primitives",
    component: <ToggleSwitchDemo />,
  },
  { id: "tooltip", label: "Tooltip", category: "Primitives", component: <TooltipDemo /> },

  // Components
  { id: "accordion", label: "Accordion", category: "Components", component: <AccordionDemo /> },
  { id: "alert", label: "Alert", category: "Components", component: <AlertDemo /> },
  { id: "card", label: "Card", category: "Components", component: <CardDemo /> },
  {
    id: "colourpicker",
    label: "ColourPicker",
    category: "Components",
    component: <ColourPickerDemo />,
  },
  {
    id: "confirmdialog",
    label: "ConfirmDialog",
    category: "Components",
    component: <ConfirmDialogDemo />,
  },
  { id: "dateinput", label: "DateInput", category: "Components", component: <DateInputDemo /> },
  {
    id: "dropdownmenu",
    label: "DropdownMenu",
    category: "Components",
    component: <DropdownMenuDemo />,
  },
  { id: "emptystate", label: "EmptyState", category: "Components", component: <EmptyStateDemo /> },
  { id: "field", label: "Field", category: "Components", component: <FieldDemo /> },
  {
    id: "inputdialog",
    label: "InputDialog",
    category: "Components",
    component: <InputDialogDemo />,
  },
  {
    id: "membercard",
    label: "Member & Detail Cards",
    category: "Components",
    component: <MemberCardDemo />,
  },
  {
    id: "multiselect",
    label: "MultiSelect",
    category: "Components",
    component: <MultiSelectDemo />,
  },
  {
    id: "searchinput",
    label: "SearchInput",
    category: "Components",
    component: <SearchInputDemo />,
  },
  { id: "select", label: "Select", category: "Components", component: <SelectDemo /> },
  { id: "table", label: "Table", category: "Components", component: <TableDemo /> },
  { id: "tabs", label: "Tabs", category: "Components", component: <TabsDemo /> },
  { id: "timeline", label: "Timeline", category: "Components", component: <TimelineDemo /> },
];
