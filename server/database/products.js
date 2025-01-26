let produtos = [
  {
    id: "sweat-24-25-azul",
    type: "clothing",
    subtype: "sweat",
    name: "SWEATS EIC 24/25",
    displayName: {
      text: "SWEATS EIC 24/25 - AZUL PETRÓLEO",
      html: "SWEATS EIC 24/25 - <span style='color: #0066FF'>AZUL PETRÓLEO</span>",
      components: [
        {
          text: "SWEATS EIC 24/25 - ",
          style: "default",
        },
        {
          text: "AZUL PETRÓLEO",
          style: "highlight",
          color: "#0066FF",
        },
      ],
    },
    price: 20.0,
    stockType: "onDemand",
    orderInfo: {
      estimatedDelivery: "Abril 2024",
      minOrderQuantity: 1,
      orderDeadline: "2025-01-23T23:59:59Z",
    },
    visible: true,
    featured: true,
    color: {
      name: "AZUL PETRÓLEO",
      hex: "#1B4B6B",
    },
    variants: [
      {
        size: "XS",
        available: true,
        stockQuantity: null,
      },
      {
        size: "S",
        available: true,
        stockQuantity: null,
      },
      {
        size: "M",
        available: true,
        stockQuantity: null,
      },
      {
        size: "L",
        available: true,
        stockQuantity: null,
      },
      {
        size: "XL",
        available: true,
        stockQuantity: null,
      },
      {
        size: "XXL",
        available: true,
        stockQuantity: null,
      },
    ],
    images: [
      {
        url: "/products/sweats/Blue.jpg",
        alt: "Vista frontal da sweat azul petróleo",
        isPrimary: true,
      },
    ],
  },
  {
    id: "sweat-24-25-bordeaux",
    type: "clothing",
    subtype: "sweat",
    name: "SWEATS EIC 24/25",
    displayName: {
      text: "SWEATS EIC 24/25 - BORDEAUX",
      html: "SWEATS EIC 24/25 - <span style='color: #6E1423'>BORDEAUX</span>",
      components: [
        {
          text: "SWEATS EIC 24/25 - ",
          style: "default",
        },
        {
          text: "BORDEAUX",
          style: "highlight",
          color: "#6E1423",
        },
      ],
    },
    price: 20.0,
    stockType: "onDemand",
    orderInfo: {
      estimatedDelivery: "Abril 2024",
      minOrderQuantity: 1,
      orderDeadline: "2025-01-23T23:59:59Z",
    },
    visible: true,
    featured: true,
    color: {
      name: "BORDEAUX",
      hex: "#6E1423",
    },
    variants: [
      {
        size: "XS",
        available: true,
        stockQuantity: null,
      },
      {
        size: "S",
        available: true,
        stockQuantity: null,
      },
      {
        size: "M",
        available: true,
        stockQuantity: null,
      },
      {
        size: "L",
        available: true,
        stockQuantity: null,
      },
      {
        size: "XL",
        available: true,
        stockQuantity: null,
      },
    ],
    images: [
      {
        url: "/products/sweats/Bordeaux1.jpg",
        alt: "Vista frontal da sweat bordeaux",
        isPrimary: true,
      },
      {
        url: "/products/sweats/Bordeaux2.jpg",
        alt: "Vista frontal da sweat bordeaux",
        isPrimary: false,
      },
    ],
  },
  {
    id: "sticker-programmer-cat",
    type: "stickers",
    subtype: "sticker",
    name: "I ARE PROGRAMMER",
    displayName: {
      text: "I ARE PROGRAMMER - BEEP BOOP",
      html: "I ARE PROGRAMMER - <span style='color: #333333'>BEEP BOOP</span>",
      components: [
        {
          text: "I ARE PROGRAMMER - ",
          style: "default",
        },
        {
          text: "BEEP BOOP",
          style: "highlight",
          color: "#333333",
        },
      ],
    },
    price: 2.5,
    stockType: "onDemand",
    orderInfo: {
      estimatedDelivery: "Abril 2024",
      minOrderQuantity: 1,
      orderDeadline: "2025-01-23T23:59:59Z",
    },
    visible: true,
    featured: true,
    variants: [
      {
        size: "7x7cm",
        available: true,
        stockQuantity: 100,
      },
    ],
    images: [
      {
        url: "/products/stickers/IAreProgrammer.jpg",
        alt: "Sticker de um gato programador deitado sobre um teclado com o texto 'I ARE PROGRAMMER, I MAKE COMPUTER BEEP BOOP BEEP BEEP BOOP'",
        isPrimary: true,
      },
    ],
    description:
      "Sticker engraçado com um gato programador que faz o computador fazer beep boop",
    details: {
      material: "Vinil resistente à água",
      dimensions: "7x7cm",
      finish: "Matte",
      durability: "Resistente a água e luz solar",
      adhesive: "Removível sem deixar resíduos",
    },
  },
];

module.exports = produtos;
