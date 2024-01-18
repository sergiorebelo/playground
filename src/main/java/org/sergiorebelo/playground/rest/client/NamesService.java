package org.sergiorebelo.playground.rest.client;


import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.Set;

@Path("/names")
@RegisterRestClient(configKey = "names-api")
public interface NamesService {

    @GET
    Set<Name> getByName(@QueryParam("name") String name);

}
