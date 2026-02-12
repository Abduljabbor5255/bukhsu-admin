import { $themeColors } from '@themeConfig'

export const chartColors = {
  primaryColorShade: '#836AF9',
  yellowColor: '#ffe800',
  successColorShade: '#28dac6',
  warningColorShade: '#ffe802',
  warningLightColor: '#FDAC34',
  infoColorShade: '#299AFF',
  greyColor: '#4F5D70',
  blueColor: '#2c9aff',
  blueLightColor: '#84D0FF',
  greyLightColor: '#EDF1F4',
  tooltipShadow: 'rgba(0, 0, 0, 0.25)',
  lineChartPrimary: '#666ee8',
  lineChartDanger: '#ff4961',
  labelColor: '#6e6b7b',
  grid_line_color: 'rgba(200, 200, 200, 0.2)',
}

export const barCharDefaultOptions = {
  elements: {
    rectangle: {
      borderWidth: 2,
      borderSkipped: 'bottom',
    },
  },

  // indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  responsiveAnimationDuration: 500,
  legend: {
    display: false,
  },
  tooltips: {
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    shadowBlur: 8,
    shadowColor: chartColors.tooltipShadow,
    backgroundColor: $themeColors.light,
    titleFontColor: $themeColors.dark,
    bodyFontColor: $themeColors.dark,
  },

  // scales: {
  //     xAxes: [
  //         {
  //             display: true,
  //             gridLines: {
  //                 display: true,
  //                 color: chartColors.grid_line_color,
  //                 zeroLineColor: chartColors.grid_line_color
  //             },
  //             scaleLabel: {
  //                 display: false
  //             },
  //             ticks: {
  //                 fontColor: chartColors.labelColor
  //             }
  //         }
  //     ],
  //     yAxes: [
  //         {
  //             display: true,
  //             gridLines: {
  //                 color: chartColors.grid_line_color,
  //                 zeroLineColor: chartColors.grid_line_color
  //             },
  //             ticks: {
  //                 stepSize: 10,
  //                 min: 0,
  //                 max: 100,
  //                 fontColor: chartColors.labelColor
  //             }
  //         }
  //     ]
  // }
}
