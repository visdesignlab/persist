import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
  inputClass?: string
};

const FeatureListOne: FeatureItem[] = [
  {
    title: 'Feature 1',
    Svg: require('@site/static/img/page-analysis.svg').default,
    description: (
      <>
        Feature 1 Info
      </>
    ),
  },
  {
    title: 'Feature 2',
    Svg: require('@site/static/img/cloud-acceleration.svg').default,
    description: (
      <>
        Feature 2 Info
      </>
    ),
  },
  {
    title: 'Feature 3',
    Svg: require('@site/static/img/data-analysis.svg').default,
    description: (
      <>
        Feature 3 Info
      </>
    ),
  },
  {
    title: 'Feature 4',
    Svg: require('@site/static/img/mobile-app.svg').default,
    description: (
      <>
        Feature 4 info (optional)
      </>
    ),
    inputClass:'col--offset-2'
  },
  {
    title: 'Feature 5',
    Svg: require('@site/static/img/dns.svg').default,
    description: (
      <>
        Feature 5 Info (optional)
      </>
    ),
  },
];

function Feature({title, Svg, description, inputClass}: FeatureItem) {
  return (
    <div className={clsx('col col--4',inputClass)}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p >{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureListOne.map((props, idx) => {
            return <Feature key={idx} {...props} />
          }
          )}
        </div>
      </div>
    </section>
  );
}
