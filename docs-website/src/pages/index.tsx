import clsx from 'clsx';
import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '../components/HomepageFeatures';

import styles from './index.module.css';
import ImageSwitcher from '../components/ImageSwitcher';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--secondary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.titleContainer}>
          <ImageSwitcher 
            lightImageSrc={"img/logos/persist-logo-light.svg"}
            darkImageSrc={"img/logos/persist-logo-dark.svg"}
            className={clsx(styles.largeItem,styles.homepageLogo)}
          />
          <ImageSwitcher 
            lightImageSrc={"img/logos/persist-logo-light.svg"}
            darkImageSrc={"img/logos/persist-logo-dark.svg"}
            className={clsx(styles.smallItem,styles.homepageLogo)}
          />
          <div>
            <div className={clsx('hero__title',styles.description)}>
              Persistent And Reusable Interactions In Computational Notebooks
            </div>
            <div className={clsx('hero__subtitle',styles.subtitle)}>
              A Jupyter Plugin
            </div>
          </div>
        </div>
        <div className={styles.buttons} style={{marginTop:'50px'}}>
          <Link
            className="button button--secondary button--lg"
            to="/about">
            About Persist 
          </Link>
          <Link
            className="button button--primary button--lg"
            to="/docs/installation">
            Get Started 
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      description={`${siteConfig.tagline}`}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
