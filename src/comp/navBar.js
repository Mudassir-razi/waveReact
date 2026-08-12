import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';


export default function NavBar({ title, items = [] }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (itemOnClick) => {
    handleClose();
    if (itemOnClick) itemOnClick();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        aria-haspopup="true"
        variant='text'
        aria-expanded={open ? "true" : undefined}
        
      >
        {title}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {items.map((item, index) => (
          <MenuItem
            key={index}
            disabled={item.disabled}
            onClick={() => !item.disabled && handleItemClick(item.onClick)}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
