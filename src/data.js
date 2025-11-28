// SIMULACIÓN DE INVENTARIO DE QUINCHOS
const quinchos = [
    {
        id: 1,
        nombre: "Quincho Moderno con Pileta Climatizada",
        ciudad: "Palermo, CABA",
        precioDia: "50.000",
        precioHora: "6.000",
        capacidad: 25,
        servicios: ["Parrilla/Asador grande", "Pileta Climatizada", "Wi-Fi", "Estacionamiento privado"],
        descripcion: "Un espacio ideal para cumpleaños y eventos corporativos. Totalmente equipado con cocina industrial, barra de tragos y un amplio salón climatizado. La pileta exterior es climatizada y está disponible todo el año.",
        imagen: "placeholder-img-1.jpg"
    },
    {
        id: 2,
        nombre: "Clubhouse Familiar en Barrio Privado",
        ciudad: "Nordelta, Tigre",
        precioDia: "75.000",
        precioHora: "15.000",
        capacidad: 50,
        servicios: ["Cancha de Tenis", "Asador", "Parking", "Salón de juegos"],
        descripcion: "El lugar perfecto para grandes celebraciones. Rodeado de naturaleza y con acceso a las comodidades del club. Ideal para eventos con muchos invitados.",
        imagen: "placeholder-img-2.jpg"
    }
];

// Almacena las solicitudes de reserva aquí temporalmente
let solicitudes = [];

module.exports = {
    quinchos,
    solicitudes
};