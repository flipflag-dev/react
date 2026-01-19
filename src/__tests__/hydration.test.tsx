import React from "react";
import { render } from "@testing-library/react";
import { FlipFlagHydration, FLIPFLAG_HYDRATION_ID } from "../server/hydration";

describe("FlipFlagHydration", () => {
  it("should render script tag with serialized flags", () => {
    const flags = {
      darkMode: true,
      newFeature: false,
      betaAccess: true,
    };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    expect(script).toBeInTheDocument();
    expect(script?.id).toBe(FLIPFLAG_HYDRATION_ID);
    expect(script?.type).toBe("application/json");
    expect(script?.textContent).toBe(JSON.stringify(flags));
  });

  it("should use default ID when not provided", () => {
    const flags = { testFlag: true };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    expect(script?.id).toBe("__FLIPFLAG_DATA__");
  });

  it("should use custom ID when provided", () => {
    const flags = { testFlag: true };
    const customId = "CUSTOM_FLIPFLAG_ID";

    const { container } = render(
      <FlipFlagHydration flags={flags} id={customId} />,
    );

    const script = container.querySelector("script");
    expect(script?.id).toBe(customId);
  });

  it("should render empty object when no flags provided", () => {
    const flags = {};

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    expect(script?.textContent).toBe("{}");
  });

  it("should properly serialize complex flag structure", () => {
    const flags = {
      flag1: true,
      flag2: false,
      flag3: true,
      flag4: false,
      flag5: true,
    };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    const parsed = JSON.parse(script?.textContent || "");

    expect(parsed).toEqual(flags);
  });

  it("should handle flags with special characters in names", () => {
    const flags = {
      "flag-with-dashes": true,
      flag_with_underscores: false,
      "flag.with.dots": true,
    };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    const parsed = JSON.parse(script?.textContent || "");

    expect(parsed).toEqual(flags);
  });

  it("should use dangerouslySetInnerHTML correctly", () => {
    const flags = { test: true };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    // Check that content is set via innerHTML, not as children
    expect(script?.innerHTML).toBe(JSON.stringify(flags));
  });

  it("should render valid JSON that can be parsed", () => {
    const flags = {
      feature1: true,
      feature2: false,
      feature3: true,
    };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    const content = script?.textContent;

    expect(content).toBeTruthy();
    expect(() => JSON.parse(content!)).not.toThrow();

    const parsed = JSON.parse(content!);
    expect(parsed).toEqual(flags);
  });

  it("should handle single flag", () => {
    const flags = { singleFlag: true };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    expect(script?.textContent).toBe('{"singleFlag":true}');
  });

  it("should handle all false flags", () => {
    const flags = {
      flag1: false,
      flag2: false,
      flag3: false,
    };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    const parsed = JSON.parse(script?.textContent || "");

    expect(parsed).toEqual(flags);
    expect(parsed.flag1).toBe(false);
    expect(parsed.flag2).toBe(false);
    expect(parsed.flag3).toBe(false);
  });

  it("should handle all true flags", () => {
    const flags = {
      flag1: true,
      flag2: true,
      flag3: true,
    };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    const parsed = JSON.parse(script?.textContent || "");

    expect(parsed).toEqual(flags);
    expect(parsed.flag1).toBe(true);
    expect(parsed.flag2).toBe(true);
    expect(parsed.flag3).toBe(true);
  });

  it("should render script tag content as text", () => {
    const flags = { test: true };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    // Script tags do render their content as textContent in jsdom
    expect(container.textContent).toBe(JSON.stringify(flags));
  });

  it("should be able to render multiple instances with different IDs", () => {
    const flags1 = { flag1: true };
    const flags2 = { flag2: false };

    const { container } = render(
      <>
        <FlipFlagHydration flags={flags1} id="FLAGS_1" />
        <FlipFlagHydration flags={flags2} id="FLAGS_2" />
      </>,
    );

    const scripts = container.querySelectorAll("script");
    expect(scripts.length).toBe(2);

    const script1 = container.querySelector("#FLAGS_1");
    const script2 = container.querySelector("#FLAGS_2");

    expect(script1?.textContent).toBe(JSON.stringify(flags1));
    expect(script2?.textContent).toBe(JSON.stringify(flags2));
  });

  it("should export FLIPFLAG_HYDRATION_ID constant", () => {
    expect(FLIPFLAG_HYDRATION_ID).toBe("__FLIPFLAG_DATA__");
    expect(typeof FLIPFLAG_HYDRATION_ID).toBe("string");
  });

  it("should properly escape JSON special characters", () => {
    // Even though flag names shouldn't have these characters in real usage,
    // JSON.stringify should handle them correctly
    const flags = {
      'flag"with"quotes': true,
      "flag\\with\\backslashes": false,
    };

    const { container } = render(<FlipFlagHydration flags={flags} />);

    const script = container.querySelector("script");
    const parsed = JSON.parse(script?.textContent || "");

    expect(parsed).toEqual(flags);
  });
});
