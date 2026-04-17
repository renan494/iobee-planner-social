import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { PageContainer } from "./PageContainer";

describe("PageContainer", () => {
  it("aplica classes padrão (max-w-[1400px], mx-auto, px e py)", () => {
    const { container } = render(<PageContainer>conteúdo</PageContainer>);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("mx-auto", "px-4", "py-8", "sm:px-6", "max-w-[1400px]");
  });

  it("renderiza children", () => {
    const { getByText } = render(<PageContainer>olá mundo</PageContainer>);
    expect(getByText("olá mundo")).toBeInTheDocument();
  });

  it.each([
    ["1000", "max-w-[1000px]"],
    ["4xl", "max-w-4xl"],
    ["3xl", "max-w-3xl"],
    ["2xl", "max-w-2xl"],
  ] as const)("aplica a variante maxWidth=%s -> %s", (maxWidth, expected) => {
    const { container } = render(
      <PageContainer maxWidth={maxWidth}>x</PageContainer>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass(expected);
    expect(div).not.toHaveClass("max-w-[1400px]");
  });

  it("mescla className extra preservando as classes base", () => {
    const { container } = render(
      <PageContainer className="py-6 bg-muted">x</PageContainer>,
    );
    const div = container.firstChild as HTMLElement;
    // py-6 deve sobrescrever py-8 via tailwind-merge
    expect(div).toHaveClass("py-6", "bg-muted", "mx-auto", "max-w-[1400px]");
    expect(div).not.toHaveClass("py-8");
  });

  it("encaminha props extras para a div (data-* e id)", () => {
    const { container } = render(
      <PageContainer id="page-root" data-testid="pc">
        x
      </PageContainer>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.id).toBe("page-root");
    expect(div.getAttribute("data-testid")).toBe("pc");
  });

  it("encaminha ref para o elemento div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<PageContainer ref={ref}>x</PageContainer>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
