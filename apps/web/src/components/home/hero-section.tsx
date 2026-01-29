import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Using high-quality baby product images from Unsplash
const heroBaby = "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200&q=80";
const heroToys = "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=80";

const slides = [
  {
    id: 1,
    tag: "NEW COLLECTION",
    title: "Premium Baby Essentials",
    subtitle: "Everything your little one needs",
    price: "From $19.99",
    image: heroBaby,
    cta: "Shop Now",
  },
  {
    id: 2,
    tag: "TOYS & GIFTS",
    title: "Playful Toy Collection",
    subtitle: "Safe & educational toys for all ages",
    price: "From $9.99",
    image: heroToys,
    cta: "Explore",
  },
];

const promoCards = [
  {
    discount: "50% OFF",
    title: "Strollers",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop",
    color: "bg-baby-mint",
  },
  {
    discount: "30% OFF",
    title: "Clothing",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop",
    color: "bg-baby-pink",
  },
  {
    discount: "25% OFF",
    title: "Feeding",
    image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=400&fit=crop",
    color: "bg-baby-yellow",
  },
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="container py-6 mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main carousel */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden h-[400px] shadow-sm">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                index === currentSlide 
                  ? "opacity-100 translate-x-0" 
                  : index < currentSlide 
                    ? "opacity-0 -translate-x-full" 
                    : "opacity-0 translate-x-full"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              <div className="relative h-full flex flex-col justify-center p-8 md:p-12 text-white max-w-lg">
                <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full mb-4 w-fit animate-fade-in">
                  {slide.tag}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold mb-2 animate-fade-in animation-delay-100">
                  {slide.title}
                </h2>
                <p className="text-lg opacity-90 mb-2 animate-fade-in animation-delay-200">
                  {slide.subtitle}
                </p>
                <p className="text-2xl font-bold text-primary mb-6 animate-fade-in animation-delay-300">
                  {slide.price}
                </p>
                <Button 
                  size="lg" 
                  className="w-fit rounded-full px-8 font-semibold animate-fade-in animation-delay-400"
                >
                  {slide.cta} →
                </Button>
              </div>
            </div>
          ))}

          {/* Navigation arrows */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-sm opacity-80 hover:opacity-100"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-sm opacity-80 hover:opacity-100"
            onClick={nextSlide}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? "w-6 bg-primary" 
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Side promo cards */}
        <div className="flex lg:flex-col gap-4">
          {promoCards.map((card, index) => (
            <div
              key={index}
              className={`relative flex-1 rounded-2xl ${card.color} overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow min-h-[120px] group`}
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 " />

              <div className="relative p-6 h-full flex flex-col justify-center">
                <div className="absolute top-3 left-3 bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {card.discount}
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-heading font-bold text-foreground">
                    {card.title}
                  </h3>
                  <Button variant="link" className="p-0 h-auto text-primary hover:text-pink-600 font-semibold text-xs">
                    Shop Now →
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
