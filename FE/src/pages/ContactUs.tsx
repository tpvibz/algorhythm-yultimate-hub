import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, Phone, MapPin, MessageSquare, Send, Clock, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Get in{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Mail,
                title: "Email Us",
                content: "support@algorhythm.com",
                link: "mailto:support@algorhythm.com"
              },
              {
                icon: Phone,
                title: "Call Us",
                content: "+1 (555) 123-4567",
                link: "tel:+15551234567"
              },
              {
                icon: MapPin,
                title: "Visit Us",
                content: "Bengaluru, Karnataka, IN",
                link: "#"
              },
              {
                icon: Clock,
                title: "Working Hours",
                content: "Mon-Fri: 9AM - 6PM",
                link: "#"
              }
            ].map((item, index) => (
              <Card 
                key={index}
                className="glass-card glass-hover border-white/10 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <a 
                      href={item.link}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {item.content}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - Form and Info */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            
            {/* Contact Form */}
            <div className="animate-slide-up">
              <Card className="glass-card border-white/10">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Send Us a Message</h2>
                    <p className="text-muted-foreground">
                      Fill out the form below and we'll get back to you within 24 hours.
                    </p>
                  </div>

                  {submitted ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <Send className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold">Message Sent!</h3>
                      <p className="text-muted-foreground">
                        Thank you for reaching out. We'll respond soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-white/10 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-white/10 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-white/10 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder="How can we help?"
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium mb-2">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="w-full px-4 py-3 rounded-lg border border-white/10 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                          placeholder="Tell us more about your inquiry..."
                        />
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-card border-white/10">
                <CardContent className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Let's Talk</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Whether you're interested in organizing a tournament, starting a youth program, 
                      or just want to learn more about AlgoRhythm, we're here to help.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Our team is passionate about Ultimate Frisbee and youth development. 
                      We love connecting with communities and helping them grow.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <Globe className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Connect With Us</h3>
                    <div className="space-y-3">
                      <a 
                        href="#" 
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-sm">FB</span>
                        </div>
                        <span>Facebook</span>
                      </a>
                      <a 
                        href="#" 
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-sm">IG</span>
                        </div>
                        <span>Instagram</span>
                      </a>
                      <a 
                        href="#" 
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-sm">TW</span>
                        </div>
                        <span>Twitter</span>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10 bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-3">Need Immediate Help?</h3>
                  <p className="text-muted-foreground mb-4">
                    Check out our FAQ section for quick answers to common questions.
                  </p>
                  <Button variant="outline" className="w-full">
                    View FAQ
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Optional - Placeholder) */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <Card className="glass-card border-white/10 overflow-hidden">
              <div className="h-96 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MapPin className="h-16 w-16 mx-auto text-primary" />
                  <div>
                    <h3 className="text-2xl font-bold">Our Location</h3>
                    <p className="text-muted-foreground">Bengaluru, Karnataka, India</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center text-primary-foreground space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Join Our Community</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Be part of something bigger. Start your journey with AlgoRhythm today.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 pb-32 border-t border-border">
        <div className="container mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">AlgoRhythm</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 Y-Ultimate. Empowering communities through sport.
          </p>
          <div className="flex gap-6 justify-center text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
};

export default ContactUs;