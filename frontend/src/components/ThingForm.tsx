import AddIcon from '@mui/icons-material/Add';
import { IconButton, Stack, TextField } from '@mui/material';
import { ChangeEvent, FormEvent, useCallback, useState } from 'react';

interface Props {
    onCreate: (name: string) => void;
}

const ThingForm: React.FC<Props> = ({ onCreate }) => {
    const [name, setName] = useState('');

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setName(value);
    }, []);

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (event.currentTarget.checkValidity()) {
                onCreate(name);
                setName('');
            }
        },
        [name, onCreate]
    );

    return (
        <Stack
            direction="row"
            alignItems="center"
            flexWrap="nowrap"
            spacing={1}
            component="form"
            autoComplete="off"
            noValidate
            onSubmit={handleSubmit}
        >
            <TextField
                label="商品名"
                value={name}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                required
            />
            <IconButton edge="end" type="submit">
                <AddIcon />
            </IconButton>
        </Stack>
    );
};

export default ThingForm;
