"use client";

import Image from "next/image";
import { ActivationLink } from "@/components/ActivationAnalytics";

const examples = [
  {
    href: "/examples/laundry-sheets-scent-count-change",
    verdict: "FAIL",
    title: "Scent and sheet count changed",
    summary: "FRESH LINEN 30 SHEETS became UNSCENTED 20 SHEETS.",
    original: "/examples/foldwell-scent-count-change/original.png",
    candidate: "/examples/foldwell-scent-count-change/candidate.png",
    alt: "FOLDWELL laundry sheets approved carton and candidate with changed scent and sheet count",
  },
  {
    href: "/examples/laundry-sheets-background-change",
    verdict: "PASS",
    title: "Background changed, product matched",
    summary: "The approved carton moved into a laundry-room setting without a product change.",
    original: "/examples/foldwell-background-change/original.png",
    candidate: "/examples/foldwell-background-change/candidate.png",
    alt: "FOLDWELL laundry sheets approved studio image and matching laundry-room candidate",
  },
  {
    href: "/examples/laundry-sheets-back-view-review",
    verdict: "REVIEW",
    title: "Front details could not be verified",
    summary: "The candidate shows the back, so front logo, scent, and count need review.",
    original: "/examples/foldwell-back-view/original.png",
    candidate: "/examples/foldwell-back-view/candidate.png",
    alt: "FOLDWELL laundry sheets approved front and candidate back package view",
  },
] as const;

export function HomeExampleStrip() {
  return (
    <section className="home-example-strip" aria-labelledby="home-example-title">
      <div className="home-example-heading">
        <div>
          <p className="eyebrow">Controlled comparison examples</p>
          <h2 id="home-example-title">See PASS, REVIEW, and FAIL before your first check</h2>
          <p>These are controlled examples, not customer case studies or statistical performance claims.</p>
        </div>
        <ActivationLink
          className="text-link"
          eventName="example_cta_clicked"
          href="/examples"
          properties={{ surface: "home_example_strip", destination: "examples_hub" }}
        >
          View all examples
        </ActivationLink>
      </div>
      <div className="home-example-grid">
        {examples.map((example) => (
          <ActivationLink
            className="home-example-card"
            eventName="example_cta_clicked"
            href={example.href}
            key={example.href}
            properties={{
              surface: "home_example_strip",
              destination: example.href,
              verdict: example.verdict.toLowerCase(),
            }}
          >
            <span className="home-example-images" aria-hidden="true">
              <Image src={example.original} alt={`${example.title} approved original`} width={220} height={220} sizes="(max-width: 720px) 38vw, 150px" />
              <Image src={example.candidate} alt={example.alt} width={220} height={220} sizes="(max-width: 720px) 38vw, 150px" />
            </span>
            <span className={`example-verdict example-verdict-${example.verdict.toLowerCase()}`}>{example.verdict}</span>
            <strong>{example.title}</strong>
            <span>{example.summary}</span>
          </ActivationLink>
        ))}
      </div>
      <p className="home-example-benchmark">
        Need the complete test design?{" "}
        <ActivationLink
          className="text-link"
          eventName="example_cta_clicked"
          href="/examples/controlled-visual-qa-benchmark"
          properties={{ surface: "home_example_strip", destination: "controlled_benchmark" }}
        >
          Review the Pairvu Controlled Visual QA Benchmark
        </ActivationLink>.
      </p>
    </section>
  );
}
