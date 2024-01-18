package org.sergiorebelo.playground.rest.client;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import org.eclipse.microprofile.rest.client.inject.RestClient;


@Path("/myapp")
public class MyResource {

    @Inject
    @RestClient
    ExternalApiService externalApiService;

    @GET
    public ResponseData callExternalService() {
        return externalApiService.getResource();
    }
}

