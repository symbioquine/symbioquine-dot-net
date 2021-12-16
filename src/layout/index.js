import React from 'react'
import Helmet from 'react-helmet'
import Footer from '../components/Footer'
import Header from '../components/Header'
import config from '../../data/SiteConfig'
import styles from './index.module.scss'
import favicon from '../favicon.png'

const MainLayout = ({ children }) => (
  <>
    <Header />
    <Helmet>
      <meta name="description" content={config.siteDescription} />
      <link rel="icon" href={favicon} />
    </Helmet>
    {children}
    <Footer />
  </>
)

export default MainLayout
