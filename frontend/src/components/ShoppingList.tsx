import { List } from '@mui/material';
import { Thing } from '../models/thing';
import ShoppingListItem from './ShoppingListItem';

interface Props {
    items: Thing[];
    onBought: (item: Thing) => void;
    onCancel: (item: Thing) => void;
    onDelete: (item: Thing) => void;
}

const ShoppingList: React.FC<Props> = ({ items, onBought, onCancel, onDelete }) => {
    return (
        <List>
            {items.map((thing) => (
                <ShoppingListItem
                    key={`thing-${thing.id ?? '0'}`}
                    item={thing}
                    onBought={() => onBought(thing)}
                    onCancel={() => onCancel(thing)}
                    onDelete={() => onDelete(thing)}
                />
            ))}
        </List>
    );
};

export default ShoppingList;
