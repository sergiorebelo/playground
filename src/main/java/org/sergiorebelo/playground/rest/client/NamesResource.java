package org.sergiorebelo.playground.rest.client;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.util.Set;

@Path("/name")
public class NamesResource {

    @RestClient
    NamesService nameService;


    @GET
    @Path("/id/{id}")
    public Set<Name> id(String id) {
        return nameService.getByName(id);
    }


}
