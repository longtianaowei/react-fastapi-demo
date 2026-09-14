export interface PageData<T> {
    items:T[];
    total:number;
    page:number;
    page_size:number;
    total_pages:number;
    has_next:boolean;
    has_prev:boolean;
}


export interface ApiResponse<T> {
    code:number;
    data:T;
    message:string;
}
