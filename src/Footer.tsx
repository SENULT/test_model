import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 
import { faBone, faFilm, faPanorama, faUser } from "@fortawesome/free-solid-svg-icons"
import { Fab, Tooltip } from "@mui/material"

function Footer({
  setOpenDrawer,
  setActiveTab,
}: {
  setOpenDrawer: (open: boolean) => void
  setActiveTab: (tab: string) => void
}): JSX.Element {
  const colorPalette = {
    skeleton: "#3498DB", // Peter River Blue
    background: "#9B59B6", // Amethyst
    model: "#FF8C00", // Dark Orange
    animation: "#E74C3C", // Alizarin Red
  }

  const items = [
    { name: "Model", icon: faUser, color: colorPalette.model },
    { name: "Background", icon: faPanorama, color: colorPalette.background },
    { name: "Skeleton", icon: faBone, color: colorPalette.skeleton },
    { name: "Animation", icon: faFilm, color: colorPalette.animation },
  ];

  const radius = 100; // Radius for positioning
  const startAngle = 30; // Start angle in degrees
  const endAngle = 120; // End angle in degrees
  const stepAngle = (endAngle - startAngle) / (items.length - 1); 

  return (
    <div className="footer">
      {items.map(({ name, icon, color }, index) => {
        const angle = startAngle + stepAngle * index; 
        const radian = (angle * Math.PI) / 180; 
        const x = 65 + radius * Math.cos(radian); 
        const y = 50 + radius * Math.sin(radian); 

        return (
          <Tooltip key={index} title={name}>
            <Fab
              style={{
                position: "absolute",
                right: x, 
                bottom: y,
                width: "36px",
                height: "36px",
                backgroundColor: color,
              }}
              onClick={() => {
                setActiveTab(name.toLowerCase());
                setOpenDrawer(true);
              }}
            >
              <FontAwesomeIcon icon={icon} color="white" size="lg" />
            </Fab>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default Footer;
