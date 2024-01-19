package org.sergiorebelo.playground.rest.client;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("")//("/api")
@RegisterRestClient(configKey = "external-cat-facts-api")
public interface ExternalCatFactsApiService {

    @GET
    @Path("")//""/resource")
    @Produces(MediaType.APPLICATION_JSON)
    ExternalCatFactsApiResponseData getResource();
}
