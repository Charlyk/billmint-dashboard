"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/lib/utils";

function DataList({
  className,
  render,
  ...props
}: useRender.ComponentProps<"dl">) {
  const defaultProps = {
    className: cn("grid gap-3", className),
    "data-slot": "data-list",
  };

  return useRender({
    defaultTagName: "dl",
    props: mergeProps<"dl">(defaultProps, props),
    render,
  });
}

function DataListItem({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    className: cn(
      "flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4",
      className,
    ),
    "data-slot": "data-list-item",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

function DataListLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"dt">) {
  const defaultProps = {
    className: cn(
      "text-sm font-medium text-muted-foreground sm:w-40 sm:shrink-0",
      className,
    ),
    "data-slot": "data-list-label",
  };

  return useRender({
    defaultTagName: "dt",
    props: mergeProps<"dt">(defaultProps, props),
    render,
  });
}

function DataListValue({
  className,
  render,
  ...props
}: useRender.ComponentProps<"dd">) {
  const defaultProps = {
    className: cn("text-sm text-foreground", className),
    "data-slot": "data-list-value",
  };

  return useRender({
    defaultTagName: "dd",
    props: mergeProps<"dd">(defaultProps, props),
    render,
  });
}

export { DataList, DataListItem, DataListLabel, DataListValue };
