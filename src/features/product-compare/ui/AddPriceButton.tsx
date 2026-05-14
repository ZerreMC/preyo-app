import {Plus} from "lucide-react";
import {Button} from "@/shared/ui";

type AddPriceButtonProps = {
    onClick: () => void;
};

export function AddPriceButton({onClick}: AddPriceButtonProps) {
    return (
        <Button type="button" size="sm" leftIcon={<Plus size={15}/>} onClick={onClick}>
            Añadir precio
        </Button>
    );
}
