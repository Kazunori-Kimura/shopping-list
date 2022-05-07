import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import {
    Avatar,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { useCallback, useMemo } from 'react';
import { Thing } from '../models/thing';

interface Props {
    item: Thing;
    onBought: VoidFunction;
    onCancel: VoidFunction;
    onDelete: VoidFunction;
}

const ShoppingListItem: React.FC<Props> = ({ item, onBought, onCancel, onDelete }) => {
    const isBought = useMemo(() => {
        return Boolean(item.boughtAt);
    }, [item.boughtAt]);

    const handleClick = useCallback(() => {
        if (isBought) {
            onCancel();
        } else {
            onBought();
        }
    }, [isBought, onBought, onCancel]);

    return (
        <ListItem
            sx={{ pl: 0 }}
            secondaryAction={
                <IconButton edge="end" onClick={onDelete}>
                    <DeleteIcon />
                </IconButton>
            }
        >
            <ListItemButton onClick={handleClick}>
                <ListItemIcon>
                    <Avatar
                        sx={{
                            color: (theme) => theme.palette.common.white,
                            bgcolor: (theme) =>
                                isBought ? theme.palette.success.light : theme.palette.grey['300'],
                        }}
                    >
                        {isBought ? <CheckIcon /> : <ShoppingBagIcon />}
                    </Avatar>
                </ListItemIcon>
                <ListItemText
                    sx={{ textDecoration: isBought ? 'line-through' : 'none' }}
                    primary={item.name}
                />
            </ListItemButton>
        </ListItem>
    );
};

export default ShoppingListItem;
