import React from "react";

const CheeseIcon = ({
  rotate = 0,
  fill="",
  color = "#F4D03F",
  spotColor = "#e3c136",
  width = 24,
  height = 24,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 500 500"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* 在viewBox中心(150,125)旋转，让芝士图形居中显示 */}
    {/* <g transform={`translate(150,125) rotate(${rotate}) translate(-110,-96)`}> */}
    {/* <g transform={`translate(150,125) rotate(${rotate}) translate(-100,-60)`}> */}
    <g transform={`translate(250, 250) rotate(${rotate}) scale(1.5) translate(-109.8, -110.8)`}>
      <path
        d="M216.82,70.174l-61.951-56.333c-2.123-1.93-5.158-2.479-7.818-1.42L4.727,69.049c-3.061,1.218-4.93,4.271-4.703,7.489C0.014,76.698,0,76.856,0,77.017v32.078c0,4.143,3.357,7.5,7.5,7.5c14.104,0,25.576,11.474,25.576,25.577S21.604,167.751,7.5,167.751c-4.143,0-7.5,3.357-7.5,7.5v24.977c0,4.143,3.357,7.5,7.5,7.5h204.598c4.143,0,7.5-3.357,7.5-7.5V77.017c0-0.103-0.01-0.204-0.016-0.307c0.021-0.229,0.035-0.459,0.035-0.693C219.617,73.655,218.525,71.549,216.82,70.174z M148.242,28.09l44.459,40.428H46.637L148.242,28.09z M204.598,192.728H15v-10.673c18.803-3.528,33.076-20.07,33.076-39.883S33.803,105.818,15,102.29V83.517h189.598V192.728z"
        fill={fill ||color}
      />
      <circle cx="174.094" cy="119.719" r="10.035" fill={fill || spotColor} />
      <circle cx="76.621" cy="128.903" r="10.44" fill={fill || spotColor} />
      <circle cx="150.315" cy="155.175" r="14.25" fill={fill || spotColor} />
      <circle cx="98.102" cy="166.85" r="11.815" fill={fill || spotColor} />
      <circle cx="122.855" cy="109.572" r="12.344" fill={fill || spotColor} />
    </g>
  </svg>
);

export default CheeseIcon;