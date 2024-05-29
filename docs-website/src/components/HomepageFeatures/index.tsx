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
    title: 'Interactions that Last',
    Svg: require('@site/static/img/format-painter-svgrepo-com.svg').default,
    description: (
      <>
        Interacting with a Persist chart alters the underlying dataframe without having to write additional code. This means that you'll be able to use visual cues to alter your data without having to look tedious documentation.
      </>
    ),
  },
  {
    title: 'Operations are Trracked',
    Svg: require('@site/static/img/trend-analysis-svgrepo-com.svg').default,
    description: (
      <>
        All operations that you perform on your charts will automatically be stored in a <a href="https://github.com/Trrack" target="_blank">Trrack</a> provenance graph. Moving between various states of your chart is then managed in a built-in UI.
      </>
    ),
  },
  {
    title: 'Persist Table',
    Svg: require('@site/static/img/insert-table-svgrepo-com.svg').default,
    description: (
      <>
        With the Persist Table, you'll be able to easily manipulate your dataframe with a responsive, intuitive UI.
      </>
    ),
  }
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
