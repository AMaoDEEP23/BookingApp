import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AddressLink from "../AdressLink";
import PlaceGallery from "../PlaceGallery";
import BookingDate from "./BookingDate";
export default function BookingPage(){
    const {id} = useParams();
    const [booking,setBooking] = useState(null);

    useEffect(() => {
        if(id){
            axios.get('https://bookingapp-r8rw.onrender.com/bookings',{withCredentials: true}).then(response => {
               const foundBooking = response.data.filter(({_id}) => _id === id);
               if (foundBooking){
                setBooking(...foundBooking);
                } 
            })
        }
    },[id])

    if(!booking){
        return'';
    }

    // console.log(foundBooking);
    return(
    <div className="my-8">
        <h1 className="text-3xl">{booking.place.title}</h1>
        <AddressLink className='my-2 block'>{booking.place.address}</AddressLink>
        <div className="bg-gray-200 p-4 mb-4 rounded-2xl flex items-center justify-between">
            <div>
            <h2 className="text-2xl mb-4">Your booking information<BookingDate booking={booking}/></h2>
            </div>
            <div className="bg-primary p-6 text-white rounded-2xl">
                <div>Total price </div>
                <div className="text-3xl">${booking.price}</div>
            </div>
            
        </div>
        <PlaceGallery place={booking.place}/>
        
    </div>
        
    )}