import * as React from "react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ checked, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    checked={checked}
    readOnly
    {...props}
    className={"form-checkbox h-4 w-4 text-primary border-gray-300 rounded " + (props.className || "")}
  />
));

Checkbox.displayName = "Checkbox";

export { Checkbox };
