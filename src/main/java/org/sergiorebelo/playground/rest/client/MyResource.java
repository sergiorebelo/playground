package org.sergiorebelo.playground.rest.client;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import org.eclipse.microprofile.rest.client.inject.RestClient;


@Path("/myApp")
public class MyResource {

    @Inject
    @RestClient
    ExternalApiService externalApiService;

    @GET
    @Path("/call-api/{name}")
    public ResponseData callExternalService(@PathParam("name") String name) {

        return externalApiService.getResource(name);
    }
}

