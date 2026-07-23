import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormField } from "./form-field";

describe("FormField", () => {
  it("connects description and error text to its matching control", () => {
    const html = renderToStaticMarkup(
      createElement(
        FormField,
        {
          id: "workspace-name",
          label: "Workspace name",
          description: "Shown across the product.",
          error: { type: "validate", message: "Use at least two characters." },
        } as ComponentProps<typeof FormField>,
        createElement("input", { id: "workspace-name" }),
      ),
    );

    expect(html).toContain('aria-describedby="workspace-name-description workspace-name-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="workspace-name-description"');
    expect(html).toContain('id="workspace-name-error"');
  });

  it("preserves an existing accessible description and non-control siblings", () => {
    const html = renderToStaticMarkup(
      createElement(
        FormField,
        {
          id: "password",
          label: "Password",
          description: "Use a passphrase.",
        } as ComponentProps<typeof FormField>,
        createElement("input", { id: "password", "aria-describedby": "password-requirements" }),
        createElement("a", { href: "/forgot-password" }, "Forgot password"),
      ),
    );

    expect(html).toContain('aria-describedby="password-requirements password-description"');
    expect(html).toContain('href="/forgot-password"');
  });
});
