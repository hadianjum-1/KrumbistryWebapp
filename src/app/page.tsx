import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import PromiseStrip from "@/components/home/PromiseStrip";
import Categories from "@/components/home/Categories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Story from "@/components/home/Story";
import CustomOrder from "@/components/home/CustomOrder";
import Testimonials from "@/components/home/Testimonials";
import InstagramGallery from "@/components/home/InstagramGallery";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

import { SITE_MODE } from "@/config/site-mode";
import ComingSoon from "@/components/ComingSoon";

export default function HomePage() {
  if (SITE_MODE.comingSoon) {
    return <ComingSoon />;
  }
  return (
    <main>
      <Header />
      <Hero />
      <PromiseStrip />
      <Categories />
      <FeaturedProducts />
      <Story />
      <CustomOrder />
      <Testimonials />
      <InstagramGallery />
      <FeedbackWidget />
      <Footer />
    </main>
  );
}
