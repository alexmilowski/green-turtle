/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.milowski.sparql;

import com.hp.hpl.jena.query.Dataset;
import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;
import com.hp.hpl.jena.query.QueryExecutionFactory;
import com.hp.hpl.jena.query.QueryFactory;
import java.util.Map;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.ServerResource;

/**
 *
 * @author alex
 */
public class QueryContextResource extends ServerResource {
   
   public Representation post(Representation entity) {
      String id = getRequest().getAttributes().get("id").toString();
      getLogger().info("Query on "+id);
      Map<String,Dataset> datasets = (Map<String,Dataset>)getContext().getAttributes().get("datasets");
      if (datasets==null) {
         getResponse().setStatus(Status.CLIENT_ERROR_NOT_FOUND);
         return null;
      }
      Dataset data = datasets.remove(id);
      if (data==null) {
         getResponse().setStatus(Status.CLIENT_ERROR_NOT_FOUND);
         return null;
      }
      
      try {
         String queryString = entity.getText();
         getLogger().info("query:\n"+queryString);
         Query query = QueryFactory.create(queryString) ;
         QueryExecution qexec = QueryExecutionFactory.create(query, data) ;
         boolean result = qexec.execAsk() ;
         qexec.close() ;
         getResponse().setStatus(Status.SUCCESS_OK);
         return new StringRepresentation("<result>"+(result ? "true" : "false")+"</result>", MediaType.APPLICATION_XML);
      } catch (Exception ex) {
         getResponse().setStatus(Status.CLIENT_ERROR_BAD_REQUEST);
         return new StringRepresentation("<error>"+NewContextResource.escape(ex.toString())+"</error>", MediaType.APPLICATION_XML);
      }
   }
}
