import { CakeSlice, Gift, Heart, Sparkles } from "lucide-react";

const promises = [
  { icon: Sparkles, title: "Premium ingredients", text: "Only the good stuff" },
  { icon: CakeSlice, title: "Freshly crafted", text: "Made with care" },
  { icon: Gift, title: "Beautifully presented", text: "A treat to remember" },
  { icon: Heart, title: "Made for moments", text: "Big and little celebrations" },
];

export default function PromiseStrip() {
  return (
    <section className="promise-strip">
      <div className="site-container promise-grid">
        {promises.map(({ icon: Icon, title, text }) => (
          <div className="promise-item" key={title}>
            <span className="promise-icon"><Icon /></span>
            <span><strong>{title}</strong><small>{text}</small></span>
          </div>
        ))}
      </div>
    </section>
  );
}
