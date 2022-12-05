export interface TShopsProducts {
    name: string;
    address: string;

    metro: string
    products: { type: string; subType: string; id: number; name: string; badge: number; oldPrice: number | string; newPrice: number | string; imgUrl?: string }[];
}

export interface TContent {
    content: {
        items: {
            group: {
                key: string;
                title: string;
            };
            products: {
                id: number;
                title: string;
                image: {
                    cropUrlTemplate: string;
                };
                priceTag: {
                    price: number;
                    grossPrice: number;
                };
            }[];
        }[];
    };
}

export interface TShops {
    content: {
        items: {
            id: number,
            title: string,
            address: string,
            metroStations: {
                name: string
                distance: number | null
            }[]
        }[]
    }
}

export interface TPickup {
    content: {
        deliveryMode:{
            shop: {
                id: number
            }
        }
    }
}
