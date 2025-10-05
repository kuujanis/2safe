const Arrow = ({
  color = "#b1b1b1ff",
  size = 24,
  className = "",
  style = {}
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
        stroke={color}
        strokeWidth="2"
      />
      {/* <path
        d="M12 3L8 8H16L12 3Z"
        fill={color}
      /> */}
      <path
        d="M12 21L16 16H8L12 21Z"
        fill={color}
      />
    </svg>
  );
};

export default Arrow;