import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Article.css';

const Article = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  // Placeholder data - in a real app, you would fetch based on ID
  const article = {
    title: 'Ultimate Guide to Passing the STK in 2026',
    author: 'Jiri Admin',
    date: 'May 18, 2026',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=2000&auto=format&fit=crop',
    content: `
      <p>The technical inspection (STK) process has become stricter this year. Whether you are importing a car or just going for your regular two-year check, you need to be prepared.</p>
      
      <h3>1. What to Bring</h3>
      <p>Always bring your large and small registration documents (Velký technický průkaz and Malý technický průkaz). If you have an emissions protocol, bring that too.</p>

      <h3>2. Common Failure Points</h3>
      <p>Make sure all your lights are working. Even a single burnt-out license plate bulb can cause a failure. Also, check your tires for sufficient tread depth (at least 1.6mm for summer tires) and ensure your brakes are not worn out.</p>

      <h3>3. First Aid Kit</h3>
      <p>Don't forget the mandatory equipment! The Czech Republic requires a specific first-aid kit that is not expired, a reflective vest for every passenger, a warning triangle, and a spare wheel or tire repair kit.</p>
      
      <p>By preparing these simple things, you can save yourself a lot of time and money at the inspection station.</p>
    `
  };

  return (
    <PageTransition>
      <div className="article-page container">
        <Link to="/blog" className="back-link">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
        
        <motion.article 
          className="article-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <header className="article-header">
            <h1>{article.title}</h1>
            <div className="article-meta">
              <span><User size={16}/> {article.author}</span>
              <span><Calendar size={16}/> {article.date}</span>
            </div>
          </header>
          
          <div className="article-image">
            <img src={article.image} alt={article.title} />
          </div>
          
          <div 
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </motion.article>
      </div>
    </PageTransition>
  );
};

export default Article;
