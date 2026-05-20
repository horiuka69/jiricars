import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, Flame, Search, Tag, ChevronRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import forumBannerImg from '../assets/forum_banner.png';
import './Forum.css';

const Forum = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');

  const topics = [
    {
      id: 1,
      title: 'Importing a car from Germany - 2026 Guide',
      author: 'MartinK',
      replies: 42,
      views: 1205,
      category: t('forum.cat.reg'),
      lastActive: '2 mins ago',
      hot: true
    },
    {
      id: 2,
      title: 'Best detailing shops in Prague?',
      author: 'AutoFanCZ',
      replies: 15,
      views: 340,
      category: t('forum.cat.det'),
      lastActive: '1 hour ago',
      hot: false
    },
    {
      id: 3,
      title: 'STK failed due to aftermarket exhaust. Advice needed.',
      author: 'Speedy1990',
      replies: 8,
      views: 210,
      category: t('forum.cat.stk'),
      lastActive: '3 hours ago',
      hot: false
    },
    {
      id: 4,
      title: 'Show off your rides! (May Edition)',
      author: 'JiriCarsAdmin',
      replies: 112,
      views: 4500,
      category: t('forum.cat.gen'),
      lastActive: '5 hours ago',
      hot: true
    }
  ];

  return (
    <PageTransition>
      <div className="forum-page container">
        <div className="forum-header">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>{t('forum.title')}</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {t('forum.subtitle')}
          </motion.p>
          <motion.div className="forum-controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder={t('forum.search')} />
            </div>
            <button className="btn btn-primary">{t('forum.new')}</button>
          </motion.div>
        </div>

        <div className="forum-layout">
          <aside className="forum-sidebar">
            <div className="glass-panel sidebar-box">
              <h3>{t('forum.cats')}</h3>
              <ul className="category-list">
                <li className="active"><Tag size={16}/> {t('forum.cat.all')}</li>
                <li><Tag size={16}/> {t('forum.cat.reg')}</li>
                <li><Tag size={16}/> {t('forum.cat.stk')}</li>
                <li><Tag size={16}/> {t('forum.cat.det')}</li>
                <li><Tag size={16}/> {t('forum.cat.buy')}</li>
                <li><Tag size={16}/> {t('forum.cat.gen')}</li>
              </ul>
            </div>
            
            <div className="glass-panel forum-banner-card">
              <img src={forumBannerImg} alt="Community Banner" className="forum-sidebar-banner" />
            </div>
          </aside>

          <main className="forum-main">
            <div className="forum-filters glass-panel">
              <div className="filter-tabs">
                <button className={`filter-tab ${sort === 'recent' ? 'active' : ''}`} onClick={() => setSort('recent')}><Clock size={16}/> {t('forum.filter.recent')}</button>
                <button className={`filter-tab ${sort === 'hot' ? 'active' : ''}`} onClick={() => setSort('hot')}><Flame size={16}/> {t('forum.filter.hot')}</button>
                <button className="filter-tab"><MessageSquare size={16}/> {t('forum.filter.unanswered')}</button>
              </div>
            </div>

            <div className="topics-list">
              {topics.map((topic, index) => (
                <motion.div 
                  key={topic.id} 
                  className="topic-card glass-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
                >
                  <div className="topic-content">
                    {topic.hot && <span className="badge badge-hot"><Flame size={12}/> {t('forum.filter.hot')}</span>}
                    <span className="badge badge-category">{topic.category}</span>
                    <h3 className="topic-title">{topic.title}</h3>
                    <div className="topic-meta">
                      <span>{t('forum.by')} <strong>{topic.author}</strong></span>
                      <span>•</span>
                      <span>{t('forum.active')}: {topic.lastActive}</span>
                    </div>
                  </div>
                  <div className="topic-stats">
                    <div className="stat">
                      <MessageSquare size={18} />
                      <span>{topic.replies}</span>
                    </div>
                    <ChevronRight size={20} className="topic-arrow" />
                  </div>
                </motion.div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </PageTransition>
  );
};

export default Forum;
