import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Blog.css';

const Blog = () => {
  const { t } = useTranslation();

  const posts = [
    {
      id: 1,
      title: 'Ultimate Guide to Passing the STK in 2026',
      excerpt: 'The technical inspection (STK) process has become stricter this year. Here is everything you need to prepare your car...',
      author: 'Jiri Admin',
      date: 'May 18, 2026',
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Why Ceramic Coating is a Must for Czech Winters',
      excerpt: 'Salt on the roads during winter can destroy your paint. Learn how ceramic coating provides a durable shield.',
      author: 'Detailing Pro',
      date: 'May 12, 2026',
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Top 5 Scenic Driving Routes in Bohemia',
      excerpt: 'Take your car for a spin on some of the most beautiful winding roads the Czech Republic has to offer.',
      author: 'TravelerCZ',
      date: 'May 5, 2026',
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop'
    }
  ];

  return (
    <PageTransition>
      <div className="blog-page container">
        <div className="blog-header">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>{t('blog.title')}</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {t('blog.subtitle')}
          </motion.p>
        </div>

        <div className="blog-grid">
          {posts.map((post, index) => (
            <motion.article 
              key={post.id} 
              className="blog-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * index }}
            >
              <div className="blog-image">
                <img src={post.image} alt={post.title} />
              </div>
              <div className="blog-content">
                <h2>{post.title}</h2>
                <div className="blog-meta">
                  <span><User size={14}/> {post.author}</span>
                  <span><Calendar size={14}/> {post.date}</span>
                </div>
                <p>{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="btn btn-outline btn-readmore">
                  {t('blog.read')} <ArrowRight size={16} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Blog;
