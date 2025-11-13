import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, TrendingUp, Heart, Target, Shield, Calendar, MapPin, Clock, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useMemo } from "react";
import api, { tournamentAPI, Tournament } from "@/services/api";

// Type declarations for window.storage
declare global {
  interface Window {
    storage: {
      get: (key: string, shared?: boolean) => Promise<{key: string, value: string, shared: boolean} | null>;
      set: (key: string, value: string, shared?: boolean) => Promise<{key: string, value: string, shared: boolean} | null>;
      delete: (key: string, shared?: boolean) => Promise<{key: string, deleted: boolean, shared: boolean} | null>;
      list: (prefix?: string, shared?: boolean) => Promise<{keys: string[], prefix?: string, shared: boolean} | null>;
    };
  }
}

interface Post {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  author?: string;
  category?: string;
  imageUrl?: string;
  location?: string;
  date?: string;
}

// Dummy posts for when storage is empty
const dummyPosts: Post[] = [
  {
    id: 'dummy-1',
    title: 'Championship Tournament 2025',
    content: 'Join us for the biggest Ultimate Frisbee tournament of the year! Teams from across the region will compete for the championship title.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    author: 'Tournament Director',
    category: 'Tournament',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
    location: 'National Sports Complex',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks from now
  },
  {
    id: 'dummy-2',
    title: 'Youth Coaching Program Launch',
    content: 'Exciting news! We are launching a new youth development program focused on building skills, teamwork, and character through Ultimate Frisbee.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    author: 'Coach Sarah',
    category: 'Program',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop',
    location: 'Community Center',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
  },
  {
    id: 'dummy-3',
    title: 'Spirit of the Game Workshop',
    content: 'Learn about the core values of Ultimate Frisbee and how to foster fair play and respect on and off the field. Open to all players and coaches.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    author: 'Admin',
    category: 'Workshop',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop',
    location: 'Online',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() // 3 weeks from now
  }
];

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 3;

  // Build absolute URLs for files returned as relative paths (e.g., /uploads/..)
  const fileBaseUrl = useMemo(() => {
    try {
      const base = (api as any)?.defaults?.baseURL as string | undefined;
      if (!base) return "";
      const url = new URL(base);
      // api base is http://host:port/api → strip trailing /api
      return `${url.origin}`;
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    // Initial load of tournaments as posts
    const loadInitial = async () => {
      try {
        setLoading(true);
        const resp = await tournamentAPI.getAllTournaments({ limit, page: 1 });
        const items: Tournament[] = resp?.data?.tournaments || [];
        const mapped: Post[] = items.map((t) => ({
          id: t._id,
          title: t.name,
          content: t.description || "",
          timestamp: t.createdAt || t.startDate,
          author: t.createdBy ? "Admin" : "Admin",
          category: "Tournament",
          imageUrl: t.image ? `${t.image.startsWith("http") ? t.image : `${fileBaseUrl}${t.image}`}` : null,
          location: t.location,
          date: t.startDate,
        }));
        setPosts(mapped);
        const total = resp?.data?.pagination?.total ?? mapped.length;
        const pages = resp?.data?.pagination?.pages ?? 1;
        setHasMore(pages > 1);
        setPage(1);
      } catch (error) {
        console.log('Error loading tournaments, using dummy posts:', error);
        setPosts(dummyPosts);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [fileBaseUrl]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const resp = await tournamentAPI.getAllTournaments({ limit, page: nextPage });
      const items: Tournament[] = resp?.data?.tournaments || [];
      const mapped: Post[] = items.map((t) => ({
        id: t._id,
        title: t.name,
        content: t.description || "",
        timestamp: t.createdAt || t.startDate,
        author: t.createdBy ? "Admin" : "Admin",
        category: "Tournament",
        imageUrl: t.image ? `${t.image.startsWith("http") ? t.image : `${fileBaseUrl}${t.image}`}` : null,
        location: t.location,
        date: t.startDate,
      }));
      setPosts((prev) => [...prev, ...mapped]);
      const pages = resp?.data?.pagination?.pages ?? nextPage;
      setHasMore(nextPage < pages);
      setPage(nextPage);
    } catch (error) {
      console.log('Error loading more tournaments:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
              Empowering Youth Through{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sport & AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              YUltimate brings together Ultimate Frisbee tournaments and youth development programs with AI-driven insights
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link to="/select-role">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live News/Posts Section */}
      {!loading && posts.length > 0 && (
        <section className="py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none"></div>
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary">Live Updates</span>
              </div>
              <h2 className="text-4xl font-bold">Latest News & Announcements</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {posts.map((post, index) => (
                <Card 
                  key={post.id} 
                  className="glass-card glass-hover border-white/10 hover:-translate-y-1 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-0">
                    <div className="w-full h-48 overflow-hidden">
                      {post.imageUrl ? (
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No Image</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(post.timestamp)}</span>
                        {post.category && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-primary/10 rounded-full text-primary">
                              {post.category}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold line-clamp-2">{post.title}</h3>
                      
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {post.content}
                      </p>
                      
                      {(post.location || post.date) && (
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2">
                          {post.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {post.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{post.location}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">
                          By {post.author || 'Admin'}
                        </span>
                        <Button variant="ghost" size="sm" className="text-primary">
                          Read More →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" size="lg" onClick={loadMore} disabled={!hasMore || isLoadingMore}>
                {isLoadingMore ? 'Loading…' : hasMore ? 'More Tournaments' : 'No More Tournaments'}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: "Tournament Management",
                description: "Seamlessly organize and manage Ultimate Frisbee tournaments with real-time scoring and spirit tracking"
              },
              {
                icon: Users,
                title: "Youth Development",
                description: "Track attendance, assessments, and progress for coaching programs across communities"
              },
              {
                icon: TrendingUp,
                title: "AI-Powered Insights",
                description: "Get predictive analytics and actionable insights to maximize engagement and impact"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card glass-hover border-white/10 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We believe in the transformative power of sport. Through Ultimate Frisbee and 
              structured youth programs, we're building communities, developing life skills, 
              and creating opportunities for young people to thrive.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {[
                { icon: Heart, label: "Inclusive & Accessible", value: "For Everyone" },
                { icon: Target, label: "Impact Driven", value: "Real Results" },
                { icon: Shield, label: "Transparent & Fair", value: "Spirit First" }
              ].map((stat, index) => (
                <div key={index} className="space-y-2">
                  <stat.icon className="h-8 w-8 mx-auto text-primary" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center text-primary-foreground space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Join?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Whether you're organizing tournaments or running youth programs, YUltimate has the tools you need
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Create Account
              </Button>
            </Link>
            <Link to="/select-role">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Sign In
              </Button>
            </Link>
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
            <span className="text-lg font-bold">YUltimate</span>
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

export default Home;