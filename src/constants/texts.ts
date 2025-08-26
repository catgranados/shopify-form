interface FieldProps {
    id: string;
    label: string;
    inputPlaceholder: string;
    buttonText: string;
    errorMessage: string;
}

const FormTexts = {
    title: "Generar documento legal",
    orderNumber: {
        id: "orderNumber",
        label: "Número de pedido",
        inputPlaceholder: "Ej. 1001",
        buttonText: "Consultar",
        errorMessage: "Por favor ingresa un número de pedido válido."
    } as FieldProps
}

export default FormTexts;