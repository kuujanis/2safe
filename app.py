#%%
import geopandas as gpd
import networkx as nx
from shapely.geometry import Point, LineString
import numpy as np
from flask import Flask
import requests
import json
def load_gpkg_as_graph(gpkg_path, weight_col='weight weight_light', length_col='length'):
    """
    Load GPKG file and create a proper network graph with connectivity.
    
    Args:
        gpkg_path: Path to .gpkg file
        weight_col: Column name for segment desirability weights
        length_col: Column name for segment lengths
    
    Returns:
        NetworkX Graph with proper connectivity
    """
    # Read the GPKG file
    gdf = gpd.read_file(gpkg_path)
    
    # Create UNDIRECTED graph (allows traversal in both directions)
    G = nx.Graph()
    
    # Add edges with proper node connectivity
    for idx, row in gdf.iterrows():
        geom = row.geometry
        
        # Extract start and end points
        if isinstance(geom, LineString):
            start_pt = geom.coords[0]
            end_pt = geom.coords[-1]
            
            # Use coordinate tuples as node identifiers (rounded to avoid floating point issues)
            start_node = tuple(np.round(start_pt, 6))
            end_node = tuple(np.round(end_pt, 6))
            
            weight = row[weight_col.split(" ")[0]]+row[weight_col.split(" ")[1]]
            length = row[length_col]
            
            # Calculate combined cost (negative weight = more desirable)
            # Higher desirability (positive weight) = lower cost
            cost = length / (1 + weight)  # Desirable segments get reduced cost
            
            # Add edge with attributes (undirected = can traverse both ways)
            G.add_edge(start_node, end_node, 
                      weight=weight,
                      length=length,
                      cost=cost,
                      geometry=geom,
                      orig_idx=idx)
    
    print(f"Graph connectivity:")
    print(f"  Total nodes: {G.number_of_nodes()}")
    print(f"  Total edges: {G.number_of_edges()}")
    print(f"  Connected components: {nx.number_connected_components(G)}")
    
    # Check for isolated components
    components = list(nx.connected_components(G))
    if len(components) > 1:
        print(f"  Warning: Graph has {len(components)} separate components")
        print(f"  Largest component: {len(max(components, key=len))} nodes")
    
    return G, gdf
def find_best_route(G, start_node, end_node, optimize='balanced'):
    """
    Find best route considering both desirability and length.
    Handles paths of any length through the network.
    
    Args:
        G: NetworkX graph
        start_node: Starting node coordinates (tuple)
        end_node: Ending node coordinates (tuple)
        optimize: 'balanced' (default), 'shortest', or 'most_desirable'
    
    Returns:
        List of nodes in the best path, metrics dict
    """
    
    # Check if nodes exist
    if start_node not in G:
        raise ValueError(f"Start node {start_node} not in graph")
    if end_node not in G:
        raise ValueError(f"End node {end_node} not in graph")
    
    # Check if path exists (critical for multi-segment paths)
    if not nx.has_path(G, start_node, end_node):
        # Find which components the nodes belong to
        components = list(nx.connected_components(G))
        start_comp = None
        end_comp = None
        for i, comp in enumerate(components):
            if start_node in comp:
                start_comp = i
            if end_node in comp:
                end_comp = i
        
        raise ValueError(
            f"No connected path exists between start and end nodes.\n"
            f"Start is in component {start_comp}, end is in component {end_comp}.\n"
            f"They are in separate disconnected parts of the network."
        )
    
    # Select optimization strategy
    if optimize == 'shortest':
        # Optimize for shortest distance only
        path = nx.shortest_path(G, start_node, end_node, weight='length')
        
    elif optimize == 'most_desirable':
        # Optimize for desirability, penalize negative weights heavily
        # Lower cost = better, so invert the weight relationship
        for u, v, data in G.edges(data=True):
            # Positive weight (desirable) = low cost
            # Negative weight (undesirable) = high cost
            data['desirability_cost'] = 100 * data['length'] / (1 + 2 * data['weight'])
        
        path = nx.shortest_path(G, start_node, end_node, weight='desirability_cost')
        
    else:  # balanced
        # Use the combined cost metric
        path = nx.shortest_path(G, start_node, end_node, weight='cost')
    
    # Calculate total metrics for the found path
    total_length = 0
    total_weight = 0
    total_cost = 0
    segment_details = []
    
    for i in range(len(path) - 1):
        edge_data = G[path[i]][path[i+1]]
        total_length += edge_data['length']
        total_weight += edge_data['weight']
        total_cost += edge_data['cost']
        
        segment_details.append({
            'from': path[i],
            'to': path[i+1],
            'length': edge_data['length'],
            'weight': edge_data['weight'],
            'cost': edge_data['cost']
        })
    
    metrics = {
        'total_length': total_length,
        'avg_weight': total_weight / (len(path) - 1) if len(path) > 1 else 0,
        'total_weighted_desirability': total_weight,
        'total_cost': total_cost,
        'num_segments': len(path) - 1,
        'num_nodes': len(path),
        'segment_details': segment_details
    }
    
    return path, metrics

def find_nearest_node(G, point_coords):
    """
    Find the nearest graph node to given coordinates.
    
    Args:
        G: NetworkX graph
        point_coords: (x, y) tuple
    
    Returns:
        Nearest node coordinates and distance
    """
    nodes = list(G.nodes())
    point = np.array(point_coords)
    
    min_dist = float('inf')
    nearest = None
    
    for node in nodes:
        dist = np.linalg.norm(np.array(node) - point)
        if dist < min_dist:
            min_dist = dist
            nearest = node
    
    return nearest, min_dist

def export_route_to_gpkg(path, G, gdf, output_path):
    """
    Export the selected route to a new GPKG file.
    
    Args:
        path: List of nodes in route
        G: NetworkX graph
        gdf: Original GeoDataFrame
        output_path: Path for output .gpkg file
    """
    route_indices = []
    
    for i in range(len(path) - 1):
        edge_data = G[path[i]][path[i+1]]
        route_indices.append(edge_data['orig_idx'])
    
    route_gdf = gdf.iloc[route_indices].copy()
    route_gdf['route_order'] = range(len(route_indices))
    # route_gdf.to_file(output_path, driver='GPKG')
    print(f"Route exported to {output_path}")
    
    print("route_gdf", route_gdf)
    geojson = route_gdf['geometry'].to_json(indent=2)
    return geojson

def analyze_graph_connectivity(G):
    """
    Analyze and report on graph connectivity issues.
    """
    print("\n=== Graph Connectivity Analysis ===")
    
    components = list(nx.connected_components(G))
    print(f"Number of connected components: {len(components)}")
    
    if len(components) > 1:
        print("\nComponent sizes:")
        for i, comp in enumerate(sorted(components, key=len, reverse=True)):
            print(f"  Component {i+1}: {len(comp)} nodes")
    
    # Find nodes with degree 1 (dead ends)
    dead_ends = [node for node in G.nodes() if G.degree(node) == 1]
    print(f"\nDead-end nodes (degree 1): {len(dead_ends)}")
    
    # Find nodes with high degree (intersections)
    intersections = [node for node in G.nodes() if G.degree(node) > 2]
    print(f"Intersection nodes (degree > 2): {len(intersections)}")
    
    return {
        'components': components,
        'dead_ends': dead_ends,
        'intersections': intersections
    }

# Example usage
# if name == "main":
# Load the graph
gpkg_path = "analyz/data/optimized_butovo_pedestrian_graph_2gis_2.gpkg"
G, gdf = load_gpkg_as_graph(gpkg_path)

# Analyze connectivity
connectivity_info = analyze_graph_connectivity(G)

def find_nearest_node(G, point_coords):
    """
    Find the nearest graph node to given coordinates.
    
    Args:
        G: NetworkX graph
        point_coords: (x, y) tuple
    
    Returns:
        Nearest node coordinates and distance
    """
    nodes = list(G.nodes())
    point = np.array(point_coords)
    
    min_dist = float('inf')
    nearest = None
    
    for node in nodes:
        dist = np.linalg.norm(np.array(node) - point)
        if dist < min_dist:
            min_dist = dist
            nearest = node
    
    return nearest, min_dist

app = Flask(__name__)

@app.route('/api/coords=<uuid>', methods=['GET', 'POST'])
def add_message(uuid):
    list_coord = uuid.split(';')
    start_coords = (float(list_coord[0].split(",")[0]), float(list_coord[0].split(",")[1]))
    end_coords = (float(list_coord[1].split(",")[0]), float(list_coord[1].split(",")[1]))
    # print((float(start_coords.split(",")[0]), float(start_coords.split(",")[1])))
    # print(uuid.split(';'))
    # start_coords = (37.51945750, 55.54189558)  # Замените на реальные координаты старта
    # end_coords = (37.54392750, 55.54852820)    # Замените на реальные координаты конца


    # Find nearest nodes to coordinates
    start, start_dist = find_nearest_node(G, start_coords)
    end, end_dist = find_nearest_node(G, end_coords)

    print(f"Start node: {start} (distance from input: {start_dist:.2f} meters)")
    print(f"End node: {end} (distance from input: {end_dist:.2f} meters)")

    # Find best route (try different optimization strategies)
    try:
        # Try balanced approach
        path, metrics = find_best_route(G, start, end, optimize='balanced')

        print(f"\n✓ Route found!")
        print(f"  Number of segments: {metrics['num_segments']}")
        print(f"  Number of nodes traversed: {metrics['num_nodes']}")
        print(f"  Total length: {metrics['total_length']:.2f}")
        print(f"  Average segment weight: {metrics['avg_weight']:.2f}")
        print(f"  Total weighted desirability: {metrics['total_weighted_desirability']:.2f}")
        print(f"  Total cost: {metrics['total_cost']:.2f}")

        # Show first few segments
        print(f"\nFirst 5 segments:")
        for i, seg in enumerate(metrics['segment_details'][:5]):
            print(f"  {i+1}. Length: {seg['length']:.1f}, Weight: {seg['weight']:.1f}")

        # Export route
        response = export_route_to_gpkg(path, G, gdf, "best_route.gpkg")

        # Try other optimization strategies for comparison
        print("\n=== Comparing optimization strategies ===")

        path_short, metrics_short = find_best_route(G, start, end, optimize='shortest')
        print(f"Shortest path: {metrics_short['total_length']:.2f} length, "
                f"{metrics_short['avg_weight']:.2f} avg weight")

        path_desir, metrics_desir = find_best_route(G, start, end, optimize='most_desirable')
        print(f"Most desirable: {metrics_desir['total_length']:.2f} length, "
                f"{metrics_desir['avg_weight']:.2f} avg weight")
        print(response)
        return response
    except ValueError as e:
        print(f"\n✗ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Verify your start/end nodes are in the same connected component")
        print("2. Check if your network has disconnected segments")
        print("3. Use analyze_graph_connectivity() to identify issues")
        return uuid.split(';')

if __name__ == "__main__":
    app.run(debug=True)

# %%
