"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Cake,
  Calendar,
  CheckCircle2,
  HeartHandshake,
  Image as ImageIcon,
  MessageCircle,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { getCustomOrderWhatsAppUrl } from "@/lib/whatsapp";

interface FormData {
  customerName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  deliveryDate: string;
  servings: string;
  cakeSize: string;
  flavor: string;
  filling: string;
  designDescription: string;
  budgetRange: string;
  notes: string;
}

export default function CustomOrdersPage() {
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    email: "",
    phone: "",
    eventType: "Birthday",
    eventDate: "",
    deliveryDate: "",
    servings: "20-30 guests",
    cakeSize: "2 Tiers",
    flavor: "Belgian Dark Chocolate Ganache",
    filling: "Salted Caramel Buttercream",
    designDescription: "",
    budgetRange: "Rs. 8,000 – 15,000",
    notes: "",
  });

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (referenceImages.length + files.length > 3) {
      setUploadError("You can upload a maximum of 3 reference photos.");
      return;
    }

    Array.from(files).forEach((file) => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File ${file.name} is larger than the 5MB limit.`);
        return;
      }
      // Validate type
      if (!file.type.startsWith("image/")) {
        setUploadError(`File ${file.name} is not a valid image format.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReferenceImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/custom-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          deliveryDate: formData.deliveryDate || undefined,
          servings: formData.servings,
          cakeSize: formData.cakeSize || undefined,
          flavor: formData.flavor || undefined,
          filling: formData.filling || undefined,
          designDescription: formData.designDescription,
          budgetRange: formData.budgetRange || undefined,
          images: referenceImages,
          additionalNotes: formData.notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmittedReference(data.data?.referenceNumber || "KR-SUCCESS");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit request";
      setUploadError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-[#F8F3E9] text-[#32190D]">
        {/* Hero Section */}
        <section className="page-hero relative overflow-hidden border-b border-[#32190D]/10 bg-[#FAF6EE] py-16 md:py-24">
          <div className="site-container">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D6A64B]/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#98743A] mb-6">
                <Sparkles size={13} className="text-[#B88632]" />
                BESPOKE CELEBRATION DESSERTS
              </div>
              <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.05] tracking-tight">
                Your moment.{" "}
                <em className="text-[#D6A64B] font-display italic font-normal">
                  Custom crafted.
                </em>
              </h1>
              <p className="mt-6 text-base md:text-lg leading-relaxed text-[#806E5D] max-w-2xl">
                Whether you envision a grand tiered wedding centrepiece, a luxury floral birthday cake,
                or a curated dessert banquet table, our master pastry artists bring your imagination to life.
              </p>
            </div>
          </div>
        </section>

        {/* 4-Step Process Strip */}
        <section className="py-12 border-b border-[#32190D]/10 bg-[#F1EADD]">
          <div className="site-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex gap-4 items-start">
                <span className="font-serif text-2xl font-bold text-[#D6A64B]">01</span>
                <div>
                  <h3 className="font-serif text-base font-semibold">Submit Request</h3>
                  <p className="text-xs text-[#806E5D] mt-1">Share your theme, guest count, and flavor dreams.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-serif text-2xl font-bold text-[#D6A64B]">02</span>
                <div>
                  <h3 className="font-serif text-base font-semibold">Chef Review & Quote</h3>
                  <p className="text-xs text-[#806E5D] mt-1">We assess design complexity and reply within 24 hours.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-serif text-2xl font-bold text-[#D6A64B]">03</span>
                <div>
                  <h3 className="font-serif text-base font-semibold">Handcrafted Baking</h3>
                  <p className="text-xs text-[#806E5D] mt-1">Baked from scratch with pure butter and imported cacao.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-serif text-2xl font-bold text-[#D6A64B]">04</span>
                <div>
                  <h3 className="font-serif text-base font-semibold">Careful Delivery</h3>
                  <p className="text-xs text-[#806E5D] mt-1">Temperature-controlled arrival directly at your venue.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Consultation Form Section */}
        <section className="section py-16 md:py-24">
          <div className="site-container max-w-4xl">
            {submittedReference ? (
              /* Success Confirmation Screen */
              <div className="bg-[#FAF6EE] border-2 border-[#D6A64B] p-8 md:p-14 rounded-sm text-center shadow-lg">
                <div className="w-16 h-16 rounded-full bg-[#D6A64B]/20 text-[#98743A] grid place-items-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] text-[#98743A] uppercase">
                  REQUEST RECEIVED SUCCESSFULLY
                </span>
                <h2 className="font-serif text-3xl md:text-5xl font-medium mt-2 mb-4">
                  Thank you, {formData.customerName}!
                </h2>
                <p className="text-sm md:text-base text-[#806E5D] max-w-lg mx-auto leading-relaxed mb-6">
                  Your custom cake enquiry has been logged with reference number:
                </p>

                <div className="inline-block bg-white border border-[#D6A64B] px-6 py-3 rounded-sm mb-6">
                  <span className="font-mono text-xl font-bold text-[#32190D] tracking-wider">
                    {submittedReference}
                  </span>
                </div>

                <p className="text-xs text-[#806E5D] max-w-md mx-auto leading-relaxed mb-8">
                  Our head cake designer will review your inspiration photos and specifications.
                  We will contact you via WhatsApp or Email within 24 hours to confirm date availability and provide your bespoke quotation.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href={getCustomOrderWhatsAppUrl({
                      customerName: formData.customerName,
                      eventType: formData.eventType,
                      eventDate: formData.eventDate,
                      servings: formData.servings,
                      flavor: formData.flavor,
                      referenceId: submittedReference,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-gold flex items-center gap-2"
                  >
                    <MessageCircle size={17} /> Fast-Track on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedReference(null);
                      setReferenceImages([]);
                    }}
                    className="button button-outline"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              /* Custom Order Form */
              <div className="bg-white border border-[#32190D]/10 p-6 md:p-12 rounded-sm shadow-sm">
                <div className="mb-10 text-center max-w-lg mx-auto">
                  <SectionEyebrow>BESPOKE CONSULTATION</SectionEyebrow>
                  <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2 mb-3">
                    Custom Order Request
                  </h2>
                  <p className="text-xs md:text-sm text-[#806E5D] leading-relaxed">
                    Please provide as much detail as possible. Advance booking of at least 48 to 72 hours is recommended.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Step 1: Event Details */}
                  <div>
                    <h3 className="font-serif text-lg font-semibold border-b border-[#32190D]/10 pb-2 mb-5 flex items-center gap-2 text-[#32190D]">
                      <Calendar size={18} className="text-[#B88632]" /> 1. Event & Timeline
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="eventType">
                          Event Type *
                        </label>
                        <select
                          id="eventType"
                          name="eventType"
                          required
                          value={formData.eventType}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        >
                          <option value="Birthday">Birthday Celebration</option>
                          <option value="Wedding">Wedding / Reception</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Engagement">Engagement / Nikkah</option>
                          <option value="Baby Shower">Baby Shower / Gender Reveal</option>
                          <option value="Corporate">Corporate Gala / Launch</option>
                          <option value="Other">Other Celebration</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="eventDate">
                          Event Date *
                        </label>
                        <input
                          id="eventDate"
                          type="date"
                          name="eventDate"
                          required
                          value={formData.eventDate}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="deliveryDate">
                          Required Delivery / Pickup Date *
                        </label>
                        <input
                          id="deliveryDate"
                          type="date"
                          name="deliveryDate"
                          required
                          value={formData.deliveryDate}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Cake Structure & Flavor */}
                  <div>
                    <h3 className="font-serif text-lg font-semibold border-b border-[#32190D]/10 pb-2 mb-5 flex items-center gap-2 text-[#32190D]">
                      <Cake size={18} className="text-[#B88632]" /> 2. Cake Size & Flavor Architecture
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="servings">
                          Number of Servings / Guests *
                        </label>
                        <select
                          id="servings"
                          name="servings"
                          required
                          value={formData.servings}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        >
                          <option value="8-12 guests">8 – 12 guests (Intimate / Family)</option>
                          <option value="15-20 guests">15 – 20 guests</option>
                          <option value="20-30 guests">20 – 30 guests</option>
                          <option value="35-50 guests">35 – 50 guests</option>
                          <option value="50-100 guests">50 – 100 guests (Grand celebration)</option>
                          <option value="100+ guests">100+ guests (Wedding banquet)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="cakeSize">
                          Preferred Size or Tiers *
                        </label>
                        <select
                          id="cakeSize"
                          name="cakeSize"
                          required
                          value={formData.cakeSize}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        >
                          <option value="Single Tier 8-inch">Single Tier (8-inch)</option>
                          <option value="Single Tier 10-inch">Single Tier (10-inch)</option>
                          <option value="2 Tiers">2 Tiers (Classic Elegant)</option>
                          <option value="3 Tiers">3 Tiers (Grand Tiered)</option>
                          <option value="Dessert Table Arrangement">Dessert Table + Cake Combo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="flavor">
                          Signature Sponge Flavor *
                        </label>
                        <select
                          id="flavor"
                          name="flavor"
                          required
                          value={formData.flavor}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        >
                          <option value="Belgian Dark Chocolate Ganache">Belgian Dark Chocolate Ganache</option>
                          <option value="Madagascar Bourbon Vanilla Bean">Madagascar Bourbon Vanilla Bean</option>
                          <option value="Velvet Cocoa Cream Cheese">Velvet Cocoa Cream Cheese</option>
                          <option value="Salted Caramel Biscoff Crunch">Salted Caramel Biscoff Crunch</option>
                          <option value="Alpine Strawberry Coulis">Alpine Strawberry Coulis</option>
                          <option value="Pistachio Rose Water Cardamom">Pistachio Rose Water Cardamom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="filling">
                          Frosting & Filling Preference *
                        </label>
                        <select
                          id="filling"
                          name="filling"
                          required
                          value={formData.filling}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        >
                          <option value="Swiss Meringue Buttercream">Silky Swiss Meringue Buttercream</option>
                          <option value="Whipped Cream Cheese">Whipped Cream Cheese Frosting</option>
                          <option value="Callebaut Chocolate Ganache">Callebaut Dark Chocolate Ganache</option>
                          <option value="Fresh Mascarpone Cream">Fresh Mascarpone Vanilla Cream</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Design Description & Reference Photos */}
                  <div>
                    <h3 className="font-serif text-lg font-semibold border-b border-[#32190D]/10 pb-2 mb-5 flex items-center gap-2 text-[#32190D]">
                      <ImageIcon size={18} className="text-[#B88632]" /> 3. Design Vision & References
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="designDescription">
                          Design Theme, Color Palette & Inscription *
                        </label>
                        <textarea
                          id="designDescription"
                          name="designDescription"
                          rows={4}
                          required
                          placeholder="Describe the desired design (e.g. Minimalist cream palette with 24k gold leaf and fresh white roses; inscription: 'Happy 25th Sarah & Ahmed')."
                          value={formData.designDescription}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" htmlFor="budgetRange">
                            Estimated Budget Range *
                          </label>
                          <select
                            id="budgetRange"
                            name="budgetRange"
                            required
                            value={formData.budgetRange}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                          >
                            <option value="Rs. 5,000 – 8,000">Rs. 5,000 – 8,000</option>
                            <option value="Rs. 8,000 – 15,000">Rs. 8,000 – 15,000</option>
                            <option value="Rs. 15,000 – 30,000">Rs. 15,000 – 30,000</option>
                            <option value="Rs. 30,000+ (Grand Wedding / Multi-Tier)">Rs. 30,000+ (Grand Wedding / Multi-Tier)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1.5">
                            Upload Inspiration / Reference Images (Max 3, 5MB each)
                          </label>
                          <div className="relative border-2 border-dashed border-[#D6A64B]/60 bg-[#FAF6EE] rounded-sm p-4 text-center hover:bg-[#F1EADD] transition-colors">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              title="Upload reference images"
                            />
                            <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                              <UploadCloud size={20} className="text-[#B88632]" />
                              <span className="text-xs font-medium text-[#32190D]">
                                Click to browse or drag and drop photos
                              </span>
                              <span className="text-[10px] text-[#806E5D]">
                                PNG, JPG, or WEBP up to 5MB
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {uploadError && (
                        <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200 rounded-sm">
                          {uploadError}
                        </p>
                      )}

                      {/* Upload Previews */}
                      {referenceImages.length > 0 && (
                        <div className="flex gap-4 pt-2">
                          {referenceImages.map((src, index) => (
                            <div key={index} className="relative w-24 h-24 rounded-sm border border-[#32190D]/20 overflow-hidden group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 w-5 h-5 bg-[#32190D]/80 text-white rounded-full grid place-items-center hover:bg-red-700"
                                aria-label="Remove image"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Contact Information */}
                  <div>
                    <h3 className="font-serif text-lg font-semibold border-b border-[#32190D]/10 pb-2 mb-5 flex items-center gap-2 text-[#32190D]">
                      <HeartHandshake size={18} className="text-[#B88632]" /> 4. Your Contact Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="customerName">
                          Full Name *
                        </label>
                        <input
                          id="customerName"
                          type="text"
                          name="customerName"
                          required
                          placeholder="Your name"
                          value={formData.customerName}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="email">
                          Email Address *
                        </label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          required
                          placeholder="name@domain.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="phone">
                          Phone / WhatsApp Number *
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          required
                          placeholder="+92 300 0000000"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="block text-xs font-semibold mb-1.5" htmlFor="notes">
                        Dietary Restrictions or Special Delivery Notes (Optional)
                      </label>
                      <input
                        id="notes"
                        type="text"
                        name="notes"
                        placeholder="e.g. Nut allergy / Venue security delivery pass required"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
                      />
                    </div>
                  </div>

                  {/* Submission and Action Strip */}
                  <div className="pt-6 border-t border-[#32190D]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] text-[#806E5D] max-w-sm">
                      By submitting, our pastry team will prepare a formal quote. No payment is required until design approval.
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="button button-gold py-4 px-8 text-xs font-bold w-full sm:w-auto"
                    >
                      {isSubmitting ? "Submitting Request..." : "Submit Custom Order Request"} <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Alternative Direct WhatsApp Consultation Strip */}
        <section className="bg-[#32190D] text-[#F8F3E9] py-16 border-t border-[#D6A64B]/30">
          <div className="site-container flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[#D6A64B] text-xs font-semibold uppercase tracking-[0.2em]">
                PREFER CHATTING WITH A PASTRY CHEF?
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-medium mt-1">
                Reach out directly via WhatsApp for urgent bookings
              </h3>
            </div>
            <a
              href={getCustomOrderWhatsAppUrl({ customerName: "Valued Customer" })}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-gold shrink-0 flex items-center gap-2"
            >
              <MessageCircle size={18} /> Chat on WhatsApp <ArrowUpRight size={15} />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
