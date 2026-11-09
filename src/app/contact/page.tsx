"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import InstagramIcon from "@/components/ui/InstagramIcon";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { siteSettings } from "@/config/site";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General enquiry",
    message: "",
    honeypot: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formData.honeypot) return; // Silent spam drop

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          subject: formData.subject.trim() || "General Inquiry",
          message: formData.message.trim(),
          honeypot: formData.honeypot || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const whatsAppGeneralUrl = getWhatsAppUrl(
    `Hello ${siteSettings.bakeryName}! I would like to get in touch regarding your bakery.`
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8F3E9] text-[#32190D]">
        {/* Hero Section */}
        <section className="page-hero relative overflow-hidden border-b border-[#32190D]/10 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="site-container">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D6A64B]/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#98743A] mb-6">
                <Sparkles size={13} className="text-[#B88632]" />
                WE&apos;D LOVE TO HEAR FROM YOU
              </div>

              <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.05] tracking-tight">
                Let&apos;s make something{" "}
                <em className="text-[#D6A64B] font-display italic font-normal">
                  delicious.
                </em>
              </h1>

              <p className="mt-6 text-base md:text-lg leading-relaxed text-[#806E5D] max-w-2xl">
                Planning a celebration, craving something sweet, or have a question about an order?
                Our bakery team is always here to assist.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Grid Section */}
        <section className="section py-16 md:py-24">
          <div className="site-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Contact Details Aside */}
            <aside className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B88632] mb-2">
                  DIRECT CONTACT
                </p>
                <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                  A little conversation goes a long way.
                </h2>
                <p className="text-sm text-[#6F5A4B] leading-relaxed">
                  Reach out for event catering, bulk dessert boxes, custom inquiries, or general questions.
                </p>
              </div>

              <div className="space-y-6 border-y border-[#32190D]/10 py-8">
                <ContactDetail
                  icon={<Phone size={19} />}
                  title="Telephone"
                  value={siteSettings.contactPhone}
                  href={`tel:${siteSettings.contactPhone.replace(/\s/g, "")}`}
                />
                <ContactDetail
                  icon={<Mail size={19} />}
                  title="Email"
                  value={siteSettings.contactEmail}
                  href={`mailto:${siteSettings.contactEmail}`}
                />
                <ContactDetail
                  icon={<MapPin size={19} />}
                  title="Boutique Location"
                  value={siteSettings.address}
                />
                <ContactDetail
                  icon={<Clock3 size={19} />}
                  title="Bakery Hours"
                  value={siteSettings.openingHours}
                />
              </div>

              <div className="space-y-4">
                <a
                  href={whatsAppGeneralUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 rounded-full bg-[#32190D] px-7 py-4 text-xs font-bold text-white transition hover:bg-[#4A2918]"
                >
                  <MessageCircle size={18} />
                  Chat on WhatsApp Directly
                  <ArrowUpRight size={16} />
                </a>

                <div className="flex items-center gap-3 text-xs text-[#6F5A4B] pt-2">
                  <InstagramIcon size={17} />
                  <a
                    href={siteSettings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#B88632] transition-colors"
                  >
                    Follow our kitchen on Instagram
                  </a>
                </div>
              </div>
            </aside>

            {/* Form Container */}
            <div className="rounded-sm border border-[#32190D]/10 bg-white p-6 md:p-10 shadow-sm">
              {submitted ? (
                <div className="flex min-h-[450px] flex-col items-center justify-center text-center p-6">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D6A64B]/20 text-[#9B7027]">
                    <CheckCircle2 size={32} />
                  </div>
                  <span className="text-xs font-semibold tracking-widest text-[#B88632] uppercase">
                    MESSAGE SENT
                  </span>
                  <h2 className="font-serif text-3xl font-medium mt-2 mb-3">
                    Thank you, {formData.name}!
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-[#6F5A4B] mb-8">
                    We have received your enquiry regarding &ldquo;{formData.subject}&rdquo;.
                    Our team typically responds within a few business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        subject: "General enquiry",
                        message: "",
                        honeypot: "",
                      });
                    }}
                    className="button button-outline text-xs"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B88632] mb-1">
                      GET IN TOUCH
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium">
                      Send us an enquiry.
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot field for bot prevention */}
                    <div className="hidden" aria-hidden="true">
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        value={formData.honeypot}
                        onChange={(e) =>
                          setFormData({ ...formData, honeypot: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="mb-1.5 block text-xs font-semibold">
                          Your Name *
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full rounded-sm border border-[#32190D]/15 bg-[#FAF6EE] px-4 py-3 text-xs outline-none transition focus:border-[#B88632]"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="mb-1.5 block text-xs font-semibold">
                          Email Address *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="you@domain.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full rounded-sm border border-[#32190D]/15 bg-[#FAF6EE] px-4 py-3 text-xs outline-none transition focus:border-[#B88632]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold">
                          Phone Number (Optional)
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+92 300 0000000"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full rounded-sm border border-[#32190D]/15 bg-[#FAF6EE] px-4 py-3 text-xs outline-none transition focus:border-[#B88632]"
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="mb-1.5 block text-xs font-semibold">
                          Subject *
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({ ...formData, subject: e.target.value })
                          }
                          className="w-full rounded-sm border border-[#32190D]/15 bg-[#FAF6EE] px-4 py-3 text-xs outline-none transition focus:border-[#B88632]"
                        >
                          <option value="General enquiry">General enquiry</option>
                          <option value="Custom cake order">Custom cake order</option>
                          <option value="Bulk / corporate order">Bulk / corporate order</option>
                          <option value="Product or allergen inquiry">Product or allergen inquiry</option>
                          <option value="Feedback / Experience">Feedback / Experience</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="mb-1.5 block text-xs font-semibold">
                        Your Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        placeholder="Tell us what you're thinking or planning..."
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        className="w-full resize-y rounded-sm border border-[#32190D]/15 bg-[#FAF6EE] px-4 py-3 text-xs outline-none transition focus:border-[#B88632]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="button button-dark text-xs py-3.5 px-8 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Sending Message..." : "Send Message"} <ArrowRight size={15} />
                    </button>

                    {submitError && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {submitError}
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
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
    <div className="flex gap-4 items-start">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D6A64B]/15 text-[#9B7027]">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#32190D]">{title}</p>
        {href ? (
          <a href={href} className="text-xs text-[#6F5A4B] hover:text-[#B88632] transition-colors">
            {value}
          </a>
        ) : (
          <p className="text-xs text-[#6F5A4B]">{value}</p>
        )}
      </div>
    </div>
  );
}
