declare module 'highcharts-react-official' {
  import Highcharts from 'highcharts';
  import React from 'react';

  interface HighchartsReactProps {
    highcharts: typeof Highcharts;
    options: Highcharts.Options;
    constructorType?: string;
    allowChartUpdate?: boolean;
    immutable?: boolean;
    updateArgs?: [boolean, boolean, boolean];
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
    callback?: (chart: Highcharts.Chart) => void;
  }

  const HighchartsReact: React.FC<HighchartsReactProps>;
  export default HighchartsReact;
}
