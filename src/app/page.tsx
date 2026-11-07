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

export default function HomePage() {
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
      <Footer />
    </main>
  );
}
