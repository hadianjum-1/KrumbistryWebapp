
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import InstagramIcon from "@/components/ui/InstagramIcon";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Frontend demo only. Connect this form to the backend later.
    setSubmitted(true);
  }

  return (
    <>
    
    <Header/>
    <main className="min-h-screen bg-[#F8F3E9] text-[#32190D]">
      <section className="relative overflow-hidden border-b border-[#32190D]/10">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 md:px-10 md:pb-24 md:pt-28">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#D6A64B]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
            <Sparkles size={14} className="text-[#B88632]" />
            We'd love to hear from you
          </div>

          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <div>
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#8C6B4B]">
                Get in touch
              </p>
              <h1 className="max-w-3xl font-serif text-5xl leading-[1.08] md:text-7xl">
                Let&apos;s make something
                <span className="italic text-[#B88632]"> delicious.</span>
              </h1>
            </div>
            <p className="max-w-md text-base leading-8 text-[#6F5A4B] md:justify-self-end">
              Planning a celebration, craving something sweet, or have a
              question about an order? We&apos;re just a message away.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-10 md:py-24">
        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#B88632]">
            Contact details
          </p>
          <h2 className="mb-5 font-serif text-3xl md:text-4xl">
            A little conversation goes a long way.
          </h2>
          <p className="mb-10 max-w-md leading-7 text-[#6F5A4B]">
            Reach out for custom cakes, bulk orders, product questions, or
            anything else. We&apos;ll be happy to help.
          </p>

          <div className="space-y-7">
            <ContactDetail
              icon={<Phone size={19} />}
              title="Call us"
              value="+92 XXX XXXXXXX"
              href="tel:+92XXXXXXXXXX"
            />
            <ContactDetail
              icon={<Mail size={19} />}
              title="Email"
              value="hello@krumbistry.com"
              href="mailto:hello@krumbistry.com"
            />
            <ContactDetail
              icon={<MapPin size={19} />}
              title="Visit us"
              value="Add bakery address here"
            />
            <ContactDetail
              icon={<Clock3 size={19} />}
              title="Opening hours"
              value="Add business hours here"
            />
          </div>

          <a
            href="https://wa.me/92XXXXXXXXXX"
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#32190D] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#4A2918]"
          >
            <MessageCircle size={18} />
            Chat on WhatsApp
            <ArrowUpRight size={16} />
          </a>

          <div className="mt-10 flex items-center gap-3 text-sm text-[#6F5A4B]">
            <InstagramIcon size={17} />
            <a href="#" className="transition hover:text-[#B88632]">
              Follow us on Instagram
            </a>
          </div>
        </aside>

        <div className="rounded-[2rem] border border-[#32190D]/10 bg-white/70 p-6 shadow-[0_20px_70px_rgba(50,25,13,0.06)] md:p-10">
          {submitted ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D6A64B]/15 text-[#9B7027]">
                <Send size={27} />
              </div>
              <h2 className="font-serif text-3xl">Thank you!</h2>
              <p className="mt-3 max-w-sm leading-7 text-[#6F5A4B]">
                Your form demo has been submitted. The form is not connected
                to email or a database yet.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-8 rounded-full border border-[#32190D]/20 px-6 py-3 text-sm font-semibold transition hover:bg-[#F8F3E9]"
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#B88632]">
                Send an enquiry
              </p>
              <h2 className="mb-8 font-serif text-3xl md:text-4xl">
                Tell us what&apos;s on your mind.
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField label="Your name" name="name" placeholder="Full name" required />
                  <FormField label="Email address" name="email" type="email" placeholder="you@example.com" required />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField label="Phone number" name="phone" placeholder="+92 ..." />
                  <div>
                    <label htmlFor="subject" className="mb-2 block text-sm font-semibold">
                      What is this about?
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      defaultValue=""
                      className="w-full rounded-xl border border-[#32190D]/15 bg-transparent px-4 py-4 text-sm outline-none transition focus:border-[#B88632]"
                    >
                      <option value="" disabled>Select an option</option>
                      <option>General enquiry</option>
                      <option>Custom cake order</option>
                      <option>Bulk / event order</option>
                      <option>Product question</option>
                      <option>Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-semibold">
                    Your message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us a little about what you need..."
                    className="w-full resize-y rounded-xl border border-[#32190D]/15 bg-transparent px-4 py-4 text-sm outline-none transition placeholder:text-[#9A897D] focus:border-[#B88632]"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#32190D] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#4A2918] sm:w-auto"
                >
                  Send message <ArrowRight size={17} />
                </button>

                <p className="text-xs leading-6 text-[#8B7768]">
                  This is a frontend preview. Messages will not be delivered
                  until we connect the backend.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      <section className="border-t border-[#32190D]/10 bg-[#F0E8DA]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center md:px-10">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#B88632]">
              Something special?
            </p>
            <h2 className="font-serif text-3xl">Explore our freshly baked menu.</h2>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-3 rounded-full border border-[#32190D]/20 px-6 py-4 text-sm font-semibold transition hover:bg-[#32190D] hover:text-white"
          >
            Explore menu <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </main>
    <Footer/>
    </>
  );
}

function ContactDetail({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6A64B]/15 text-[#9B7027]">
        {icon}
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold">{title}</p>
        {href ? (
          <a href={href} className="text-sm text-[#6F5A4B] hover:text-[#B88632]">
            {value}
          </a>
        ) : (
          <p className="text-sm text-[#6F5A4B]">{value}</p>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-[#32190D]/15 bg-transparent px-4 py-4 text-sm outline-none transition placeholder:text-[#9A897D] focus:border-[#B88632]"
      />
    </div>
  );
}
