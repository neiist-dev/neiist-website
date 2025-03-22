import { SegmentedControl } from '@mantine/core';
import classes from './GradientSegmentedControl.module.css';

export function GradientSegmentedControl({ data, setValue }) {
  return (
    <SegmentedControl
      radius="xl"
      size="md"
      onChange={setValue}
      data={data}
      classNames={classes}
    />
  );
}